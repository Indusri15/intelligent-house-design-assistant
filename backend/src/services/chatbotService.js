const axios = require('axios');

/**
 * Intelligent Context-Aware House Planning & Construction Engineering Chatbot Engine
 */
async function processChatbotMessage({ message, project, floorPlan, vastu, boq, stages, expenses, history }) {
  const userQuery = (message || '').toLowerCase().trim();

  // Format conversation history for multi-turn context
  let historyContext = '';
  const formattedHistoryItems = [];
  if (history && Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach(h => {
      const isUser = (h.sender === 'user' || h.role === 'user');
      const text = h.text || h.message || h.content || '';
      if (text) {
        formattedHistoryItems.push({ role: isUser ? 'user' : 'assistant', text });
      }
    });
    if (formattedHistoryItems.length > 0) {
      historyContext = '\nRecent Conversation History:\n' + formattedHistoryItems.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n') + '\n';
    }
  }

  // 1. Live LLM Integration (Gemini & OpenAI)
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey || openaiKey) {
    const projectInfo = project ? `
Project Information:
- Name: ${project.name || 'My House'}
- Location: ${project.location || 'Warangal, Telangana'}
- Plot Dimensions: ${project.plot?.width || 30}' x ${project.plot?.length || 50}' (${project.plot?.area || 1500} sq.ft)
- Facing: ${project.plot?.facingDirection || 'East'}
- Built-up Area: ${boq?.totalBuiltUpAreaSqFt || 1500} sq.ft across ${project.accommodation?.floors || 1} floor(s)
- Target Budget: ₹${project.budget ? Number(project.budget).toLocaleString('en-IN') : '35,00,000'}
- Selected Package: ${boq?.selectedPackage || 'MEDIUM'}
- Estimated Total Cost: ₹${boq?.totalEstimatedCost ? Number(boq.totalEstimatedCost).toLocaleString('en-IN') : '32,25,000'} (Variance: ₹${boq?.budgetDifference ? Number(boq.budgetDifference).toLocaleString('en-IN') : '0'})
- Vastu Compliance Score: ${vastu?.overallScore || 85}/100 (${vastu?.grade || 'GOOD'})
- Construction Stages Completed: ${stages ? stages.filter(s => s.status === 'Completed').length : 0} of ${stages ? stages.length : 21}
` : 'No specific project loaded. General architectural and construction inquiry.';

    const contextPrompt = `You are the AI Architectural, Civil Engineering, and Construction Planning Assistant for an intelligent house design platform.
${projectInfo}
${historyContext}
Current User Question: "${message}"

Instructions:
- Provide an accurate, practical, engineering-informed response tailored to Indian residential construction (IS 456, IS 1200, National Building Code of India 2016).
- If answering project-specific questions, use the exact loaded project metrics above. Never fabricate nonexistent project values.
- If answering timeline questions ("How many days does it take to complete?"), calculate based on the project's built-up area, floors, and current stage progress, distinguishing municipal approvals from on-site civil works.
- If answering cost reduction questions, provide practical material and structural strategies (AAC blocks, span optimization, procurement).
- Support relevant follow-up questions using the recent conversation history provided.
- Always include a reminder that physical blueprints and structural stability must be certified by a licensed structural engineer before construction.`;

    // Try Gemini first if key is present
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const contents = [];
        
        if (formattedHistoryItems.length > 0) {
          formattedHistoryItems.forEach(item => {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: contextPrompt }]
        });

        const geminiResp = await axios.post(geminiUrl, {
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
        }, { timeout: 20000 });

        const replyText = geminiResp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return {
            reply: replyText,
            source: 'gemini_1.5_flash'
          };
        }
      } catch (geminiErr) {
        console.warn('[Chatbot Notice] Gemini API call failed, trying OpenAI or expert knowledge engine:', geminiErr.message);
      }
    }

    // Try OpenAI if key is present
    if (openaiKey) {
      try {
        const openAiMessages = [
          { role: 'system', content: `You are an intelligent architectural, civil engineering, and construction planning assistant for Indian residential construction (IS 456, IS 1200, NBC 2016).\n${projectInfo}` }
        ];

        if (formattedHistoryItems.length > 0) {
          formattedHistoryItems.forEach(item => {
            openAiMessages.push({
              role: item.role === 'user' ? 'user' : 'assistant',
              content: item.text
            });
          });
        }
        openAiMessages.push({ role: 'user', content: message });

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          temperature: 0.7
        }, {
          headers: { Authorization: `Bearer ${openaiKey}` },
          timeout: 20000
        });

        if (response.data?.choices?.[0]?.message?.content) {
          return {
            reply: response.data.choices[0].message.content,
            source: 'openai_gpt4o'
          };
        }
      } catch (openAiErr) {
        console.warn('[Chatbot Notice] OpenAI API call failed, falling back to expert knowledge engine:', openAiErr.message);
      }
    }
  }

  // 2. Comprehensive Architectural & Civil Engineering Knowledge Engine
  let reply = '';
  const DISCLAIMER = "\n\n⚠️ *Engineering Note: Quantities, rules, and estimates are derived from empirical heuristics (IS 456, IS 1200, NBC 2016). Physical blueprints and RCC drawings must be certified by a licensed structural engineer before construction.*";
  const CONFIG_NOTE = (geminiKey || openaiKey) ? '' : "\n\n*(Answered via Built-in Architectural Knowledge Engine. To enable live conversational LLM, configure `GEMINI_API_KEY` or `OPENAI_API_KEY` in backend environment variables.)*";

  // Check if query is strictly asking to retrieve saved project-specific assets (e.g., "what is my plot size", "show my floor plan")
  const isStrictProjectQuery = (
    (userQuery.includes('what is my plot') || userQuery.includes('my plot size') || userQuery.includes('my plot details') || userQuery.includes('my plot dimension')) && !userQuery.includes('change')
  ) || (
    userQuery.includes('show my floor plan') || userQuery.includes('my saved floor plan')
  ) || (
    userQuery.includes('my saved budget')
  );

  if (isStrictProjectQuery && !project) {
    return {
      reply: "You asked about your specific project details, but no active project is currently selected.\n\n" +
        "To view your saved project metrics, please select or create a project from your **Dashboard**.\n\n" +
        "In the meantime, feel free to ask any general question about house planning, foundation, concrete, TMT steel, Vastu, brick types, or interior/exterior finishes!" +
        CONFIG_NOTE,
      source: 'expert_knowledge_engine'
    };
  }

  // A. Changing Plot Dimensions Query (Must precede generic plot info)
  if (userQuery.includes('change') && (userQuery.includes('plot') || userQuery.includes('dimension') || userQuery.includes('dimensions'))) {
    reply = `📐 **Impact of Changing Plot Dimensions:**\n\n` +
      `When you alter your plot length or width:\n` +
      `1. **Municipal Setbacks & Open Space**: Standard municipal bylaws mandate minimum clear setbacks (Front: 5 ft, Sides & Rear: 3 ft). A narrower plot restricts side airflow and window placements.\n` +
      `2. **Maximum Allowable Built-Up Area (FAR/FSI)**: The Floor Area Ratio dictates the maximum square footage you can legally build based on gross plot area.\n` +
      `3. **Structural Column Grid**: Changing plot width shifts the spans between load-bearing RCC columns. Spans exceeding 16–18 ft require deeper beams and heavier Fe 550D reinforcement.\n` +
      `4. **Vastu Zone Balance**: Proportions ideally follow 1:1.5 or 1:2 length-to-width ratios. Excessively long or irregular plots distort elemental cardinal zones (Ishanya, Agneya, Niruthi).\n\n` +
      `💡 *Action Tip:* You can update your plot dimensions directly by clicking **"Edit Project Requirements"** on your **Project Overview** page, and then click **"Regenerate Floor Plan"** to synthesize new optimized layouts.` +
      DISCLAIMER;
  }
  // B. Plot & Dimensional Constraints (Project-specific or general)
  else if (userQuery.includes('my plot') || userQuery.includes('plot dimension') || (userQuery.includes('plot') && userQuery.includes('dimension')) || (userQuery.includes('setback') && project)) {
    reply = `Your project plot measures **${project?.plot?.width || 30}' Width x ${project?.plot?.length || 50}' Length**, with a gross plot area of **${project?.plot?.area || 1500} sq.ft**.\n\n` +
      `- **Facing Direction**: **${project?.plot?.facingDirection || 'East'}**\n` +
      `- **Front Setback**: **${project?.plot?.setbacks?.front || 5} ft** | **Rear**: **${project?.plot?.setbacks?.rear || 3} ft**\n` +
      `- **Side Setbacks**: Left **${project?.plot?.setbacks?.left || 3} ft** | Right **${project?.plot?.setbacks?.right || 3} ft**\n` +
      `- **Allowable Building Footprint**: ~**${(project?.plot?.width || 30) - 6}' x ${(project?.plot?.length || 50) - 8}'** (~${boq?.totalBuiltUpAreaSqFt || 1500} sq.ft total built-up across ${project?.accommodation?.floors || 1} floor(s)).` +
      DISCLAIMER;
  }
  // C. Construction Duration / "How many days does it take to complete my house?" (Issue 6 & Issue 1)
  else if (
    userQuery.includes('how many days') ||
    userQuery.includes('how long') ||
    userQuery.includes('duration') ||
    userQuery.includes('time to complete') ||
    userQuery.includes('complete my house') ||
    userQuery.includes('completion time') ||
    userQuery.includes('how much time') ||
    (userQuery.includes('time') && userQuery.includes('finish') && userQuery.includes('house'))
  ) {
    const area = boq?.totalBuiltUpAreaSqFt || (project ? (project.plot?.area || 1500) : 1500);
    const floors = project?.accommodation?.floors || (area > 2000 ? 2 : 1);
    
    // Dynamic timeline heuristics based on house area and floors
    let onSiteMinMonths = 6;
    let onSiteMaxMonths = 8;
    let onSiteDaysMin = 180;
    let onSiteDaysMax = 240;

    if (area <= 1200 && floors === 1) {
      onSiteMinMonths = 5; onSiteMaxMonths = 7;
      onSiteDaysMin = 150; onSiteDaysMax = 210;
    } else if (area <= 2200) {
      onSiteMinMonths = 7; onSiteMaxMonths = 10;
      onSiteDaysMin = 210; onSiteDaysMax = 300;
    } else {
      onSiteMinMonths = 10; onSiteMaxMonths = 14;
      onSiteDaysMin = 300; onSiteDaysMax = 420;
    }

    const completedStages = stages ? stages.filter(s => s.status === 'Completed').length : 0;
    const totalStages = stages ? stages.length : 21;
    const activeStage = stages ? (stages.find(s => s.status === 'In Progress') || stages.find(s => s.status === 'Pending')) : null;

    reply = `⏱️ **Construction Completion Timeline Analysis:**\n\n` +
      (project ? `*Loaded Project:* **${project.name}** (~${area} sq.ft built-up area across ${floors} floor(s)).\n\n` : '') +
      `Total residential completion is divided into two primary phases:\n\n` +
      `1. **Pre-Construction & Sanctions (30 to 60 Days)**:\n` +
      `   - Soil bearing capacity test (SBC report): 7–10 days\n` +
      `   - Architectural blueprints & structural RCC drawings: 10–14 days\n` +
      `   - Municipal building permit / municipal sanction: 20–45 days (jurisdiction dependent)\n\n` +
      `2. **Physical On-Site Civil Construction (${onSiteMinMonths} to ${onSiteMaxMonths} Months / ~${onSiteDaysMin} to ${onSiteDaysMax} Days)**:\n` +
      `   - **Substructure & Foundation** (Site clearing, excavation, footings, plinth beam): **30 – 45 days**\n` +
      `   - **Superstructure RCC Frame** (Columns, shuttering, rebar binding, slab pours): **20 – 25 days per floor** (plus mandatory 14–21 days slab water curing)\n` +
      `   - **Masonry & Brickwork** (Internal & external AAC/brick walls): **25 – 35 days** (often overlaps with upper slab curing)\n` +
      `   - **MEP Concealed Rough-Ins** (Electrical conduits, CPVC plumbing): **15 – 20 days**\n` +
      `   - **Plastering & Curing** (Internal 12mm & external 20mm waterproofing): **25 – 30 days**\n` +
      `   - **Flooring, Tiling & False Ceiling**: **30 – 40 days**\n` +
      `   - **Joinery, Painting & Final Electrical Fixtures**: **25 – 35 days**\n\n` +
      (project && stages && stages.length > 0 ? 
        `📊 *Your Project Progress:* **${completedStages} of ${totalStages}** milestones completed. Current active stage: **${activeStage?.code || 'STG-01'} (${activeStage?.name || 'Planning'})**.\n\n` : '') +
      `⚠️ **Key Real-World Dependencies That Influence Duration:**\n` +
      `• **Mandatory Concrete Curing**: RCC slabs strictly require 14 to 21 days continuous water ponding before de-shuttering.\n` +
      `• **Weather / Monsoon**: Heavy monsoons temporarily halt foundation excavation and external plastering.\n` +
      `• **Overlapping Trades**: Experienced contractors save 45–60 days by starting ground-floor masonry while casting the first-floor slab.` +
      DISCLAIMER;
  }
  // D. Reducing Construction Cost (Issue 1)
  else if (userQuery.includes('reduce') && (userQuery.includes('cost') || userQuery.includes('budget') || userQuery.includes('expense') || userQuery.includes('save'))) {
    reply = `💡 **Practical Civil Engineering Strategies to Reduce Construction Cost:**\n\n` +
      `1. **Adopt AAC Blocks over Red Clay Bricks (Saves 12% – 18%)**:\n` +
      `   - AAC blocks weigh 60% less, reducing the required structural steel and concrete footing sizes.\n` +
      `   - Uses thin-bed chemical adhesive instead of thick cement-sand mortar, eliminating costly sand.\n\n` +
      `2. **Optimize Structural Column Spacing (Saves 8% – 12% on Steel)**:\n` +
      `   - Keep column spans between 12 to 16 feet. Spans exceeding 18 feet require heavy double-reinforced beams and thicker RCC slabs, rapidly inflating steel tonnage.\n\n` +
      `3. **Standardize Door & Window Openings**:\n` +
      `   - Use standard pre-fabricated UPVC 3-track sliding windows and factory-made flush doors instead of bespoke solid teakwood frames (saves ₹1.5L – ₹2.5L).\n\n` +
      `4. **Choose 4x2 GVT Tiles over Natural Marble (Saves ₹250 to ₹450 / sq.ft)**:\n` +
      `   - Glazed Vitrified Tiles (GVT) cost ₹75–₹100/sq.ft installed, whereas Italian marble costs ₹350–₹600/sq.ft and requires ongoing polishing.\n\n` +
      `5. **Procure Core Materials in Bulk Directly from Stockists**:\n` +
      `   - Purchase 50kg cement bags and Fe 550D TMT steel in full truckloads directly from authorized distributors rather than local retail yards.\n\n` +
      `6. **Lock Architectural Drawings Before Breaking Ground**:\n` +
      `   - Mid-construction structural changes (e.g. moving a bathroom or breaking a wall) account for over 25% of unexpected budget inflation.` +
      DISCLAIMER;
  }
  // E. Steel & Cement Requirements (Quick-action & general)
  else if (userQuery.includes('steel') && (userQuery.includes('cement') || userQuery.includes('requirement') || userQuery.includes('quantity') || userQuery.includes('how much') || userQuery.includes('boq'))) {
    const steel = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-04');
    const cement = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-03');
    const tiles = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-10');

    if (project && boq) {
      reply = `Key structural materials calculated for your **${boq.totalBuiltUpAreaSqFt || 1500} sq.ft** built-up area (${boq.selectedPackage || 'MEDIUM'} package):\n\n` +
        `- **Fe 550D TMT Steel**: **${steel?.purchasableQuantity || Math.round((boq.totalBuiltUpAreaSqFt || 1500) * 3.8)} kg** (~3.8 to 4.2 kg/sq.ft) — Estimated: ₹${steel?.totalCost ? Number(steel.totalCost).toLocaleString('en-IN') : '4,35,000'}\n` +
        `- **OPC 53 Cement**: **${cement?.purchasableQuantity || Math.round((boq.totalBuiltUpAreaSqFt || 1500) * 0.42)} bags** (~0.40 to 0.45 bags/sq.ft) — Estimated: ₹${cement?.totalCost ? Number(cement.totalCost).toLocaleString('en-IN') : '2,33,100'}\n` +
        `- **Floor Tiles**: **${tiles?.purchasableQuantity || Math.round((boq.totalBuiltUpAreaSqFt || 1500) * 0.8)} sq.ft** (includes 7% cutting allowance) — Estimated: ₹${tiles?.totalCost ? Number(tiles.totalCost).toLocaleString('en-IN') : '1,02,000'}\n\n` +
        `*Thumb rules for residential construction (IS 456):*\n` +
        `• TMT Steel: 3.5 – 4.5 kg per sq.ft of built-up area\n` +
        `• Cement: 0.4 – 0.45 bags per sq.ft of built-up area\n` +
        `• Sand / M-Sand: 1.8 – 2.0 cu.ft per sq.ft` +
        DISCLAIMER;
    } else {
      reply = `Standard material estimation thumb rules for residential buildings (IS 456 / IS 1200):\n\n` +
        `1. **TMT Steel (Fe 550D)**: **3.5 to 4.5 kg per sq.ft** of built-up area.\n` +
        `   - For a 1,500 sq.ft home: ~5,250 – 6,300 kg (5.25 – 6.3 tonnes).\n` +
        `2. **Cement (OPC 53 / PPC)**: **0.40 to 0.45 bags per sq.ft** of built-up area.\n` +
        `   - For a 1,500 sq.ft home: ~600 – 675 bags (50kg bags).\n` +
        `3. **Coarse Sand / M-Sand**: **1.8 to 2.2 cu.ft per sq.ft**.\n` +
        `4. **Coarse Aggregate (20mm & 10mm)**: **1.2 to 1.5 cu.ft per sq.ft**.\n` +
        `5. **Bricks / AAC Blocks**: ~8 to 9 standard clay bricks per sq.ft of wall area, or ~1.1 to 1.3 AAC blocks (600x200x150mm) per sq.ft.` +
        DISCLAIMER;
    }
  }
  // F. Kitchen Position in Floor Plan (Issue 1)
  else if (userQuery.includes('kitchen') && (userQuery.includes('position') || userQuery.includes('change') || userQuery.includes('relocate') || userQuery.includes('move'))) {
    reply = `🍳 **Relocating Kitchen in Architectural Floor Plan:**\n\n` +
      `1. **Vastu Shastra Alignment**:\n` +
      `   - **Primary Zone**: **South-East (Agneya)** — Governed by Agni (Fire). Cooking counter should face East so the cook receives morning sun.\n` +
      `   - **Permissible Alternative**: **North-West (Vayavya - Air)** — Completely valid second choice if South-East is taken by a bedroom.\n` +
      `   - **Strictly Prohibited**: Never place the kitchen in North-East (Ishanya) or South-West (Niruthi), and avoid placing it directly under a toilet.\n\n` +
      `2. **Civil & MEP Engineering Factors**:\n` +
      `   - **Plumbing Stacks**: Kitchen sink waste line (minimum 75mm PVC) must easily connect to external drainage inspection chambers.\n` +
      `   - **Ventilation**: Requires direct external wall opening for chimney duct outlet (6" core-cut) and fresh cross-ventilation.\n\n` +
      `💡 *Action Tip:* You can modify your floor plan room positions in the **Floor Plan Studio** or update your room preferences in **"Edit Project Requirements"**.` +
      DISCLAIMER;
  }
  // G. False Ceiling Advantages (Issue 1)
  else if (userQuery.includes('false ceiling') || (userQuery.includes('ceiling') && userQuery.includes('advantage'))) {
    reply = `✨ **Advantages of Saint-Gobain Gypsum False Ceiling:**\n\n` +
      `1. **Thermal Insulation & Cooling (Saves Electricity)**:\n` +
      `   - Traps a thermal air cushion beneath the concrete RCC slab, preventing external heat radiation from penetrating down into the living space. Reduces room temperature by 2°C to 4°C in summer.\n\n` +
      `2. **Concealed MEP Infrastructure**:\n` +
      `   - Perfectly hides electrical conduit wiring, AC copper piping, drain lines, and home-theatre audio cabling without damaging the concrete slab.\n\n` +
      `3. **Architectural Lighting Flexibility**:\n` +
      `   - Allows indirect ambient LED cove illumination (3000K warm white) that eliminates glare, combined with recessed anti-glare downlights and magnetic task tracks.\n\n` +
      `4. **Acoustic Absorption**:\n` +
      `   - Gypsum boards reduce acoustic reverberation, dampening echoes in large living and dining spaces.\n\n` +
      `5. **Clear Ceiling Height Standard**:\n` +
      `   - Recommended finished floor-to-ceiling clearance is **9.5 to 10 feet** (minimum 9 feet per NBC 2016).` +
      DISCLAIMER;
  }
  // H. Exterior Design Suggestion with White & Wooden Colors (Issue 1)
  else if (userQuery.includes('exterior') && (userQuery.includes('white') || userQuery.includes('wood') || userQuery.includes('suggest') || userQuery.includes('modern'))) {
    reply = `🏡 **Suggested Modern Indian Exterior Facade (White & Wood Architectural Palette):**\n\n` +
      `1. **Massing & Volumes**:\n` +
      `   - 2-story contemporary cubic volumes with floating cantilevered balconies and crisp shadow grooves.\n\n` +
      `2. **Color Harmony**:\n` +
      `   - **Primary Base Wall**: **Pure Alabaster White** weatherproof exterior acrylic emulsion (Apex Ultima Protek).\n` +
      `   - **Accent Feature Walls**: **Warm Natural Teak Wood** tones using vertical WPC architectural louvers.\n` +
      `   - **Contrast Elements**: **Dark Charcoal Slate** projection borders around large glazed windows.\n\n` +
      `3. **Facade Materials & Detailing**:\n` +
      `   - Front projection: Natural Teak Sandstone cladding or wood-composite fluted panels.\n` +
      `   - Balcony railing: 12mm frameless toughened glass with recessed stainless steel base channel.\n` +
      `   - Main entrance: Double-height porch with carved solid teak door and warm 3000K up-down facade spotlights.\n\n` +
      `💡 *Explore in Studio:* Open the **Exterior Design Studio** for this project to generate and visualize this exact color combination in photorealistic 8k quality!` +
      DISCLAIMER;
  }
  // I. Vastu Shastra Queries (Quick-action & general)
  else if (userQuery.includes('vastu') || userQuery.includes('kitchen vastu') || userQuery.includes('orientation') || userQuery.includes('compass') || userQuery.includes('direction')) {
    if (userQuery.includes('kitchen') || userQuery.includes('agneya')) {
      reply = `🧭 **Kitchen Vastu Analysis & Guidelines:**\n\n` +
        `- **Ideal Direction**: **South-East (Agneya Zone)**, governed by Agni (Fire element).\n` +
        `- **Alternative Direction**: **North-West (Vayavya Zone)** is acceptable if South-East is unavailable.\n` +
        `- **Cooking Platform & Hob**: Face **East** while cooking to receive morning solar energy.\n` +
        `- **Sink & Water Tap**: Position in the **North-East** or North corner of the kitchen (Water element opposite Fire).\n` +
        `- **Refrigerator**: Best placed in the South-West, South, or West zone.\n` +
        `- **Storage of Grains & Provisions**: Best along South or West walls.\n` +
        `- **Prohibited Zones**: Never place the kitchen directly under or adjacent to a toilet, or in the North-East (Ishanya) zone.\n\n` +
        (project && vastu ? `*Your Project Context:* Current Kitchen orientation is assigned to **${vastu.orientationSummary?.kitchenDirection || 'South-East'}** with a room compliance score of **${vastu.roomScores?.kitchen || 92}%**.` : '');
    } else if (userQuery.includes('bedroom') || userQuery.includes('master bed') || userQuery.includes('sleeping')) {
      reply = `🧭 **Master Bedroom Vastu Guidelines:**\n\n` +
        `- **Optimal Location**: **South-West (Niruthi Zone)**, representing stability and Earth element (Prithvi).\n` +
        `- **Bed Placement**: Head positioned towards the **South** or **East** for deep sleep and electromagnetic alignment. Never sleep with head towards North.\n` +
        `- **Wardrobes & Heavy Storage**: Install along the **South** or **West** walls.\n` +
        `- **Dressing Mirror**: Avoid placing mirrors directly reflecting the bed.\n` +
        `- **Attached Bathroom**: Prefer in North-West or West-of-South-West zone.` +
        (userQuery.includes('entrance') || userQuery.includes('entry') || userQuery.includes('door') ? `\n- **Main Entrance Alignment**: Best oriented in the **North-East (Ishanya)** or East zone for positive prana flow.` : '') +
        (project && vastu ? `\n\n*Your Project Context:* Master Bedroom is oriented in **${vastu.orientationSummary?.masterBedroomDirection || 'South-West'}**.` : '');
    } else if (userQuery.includes('entrance') || userQuery.includes('main door') || userQuery.includes('entry') || userQuery.includes('gate')) {
      reply = `🧭 **Main Entrance (Simha Dvara) Vastu Guidelines:**\n\n` +
        `- **Optimal Directions**: **North-East (Ishanya)**, **North (Kuber)**, or **East (Indra)**.\n` +
        `- **Auspicious Padas**: In North-facing plots, the 3rd, 4th, and 5th padas (Mukhya, Bhallat, Soma) are most beneficial.\n` +
        `- **Threshold**: Keep the main entrance clean, well-lit, and slightly elevated with a wooden threshold.\n` +
        `- **Avoid**: Never locate the main entrance in the South-West (Niruthi) zone, which should instead be reserved for the Master Bedroom.` +
        (project && vastu ? `\n\n*Your Project Context:* Entrance is oriented towards **${vastu.orientationSummary?.entranceDirection || 'North-East'}**.` : '');
    } else if (userQuery.includes('pooja') || userQuery.includes('mandir') || userQuery.includes('temple')) {
      reply = `🧭 **Pooja Room (Mandir) Vastu Guidelines:**\n\n` +
        `- **Ideal Direction**: **North-East (Ishanya Zone)**, the sacred corner of spiritual vibrations.\n` +
        `- **Alternative**: East or North directions.\n` +
        `- **Idol / Altar Orientation**: Face **East** or **West** while praying; deities should not face North-East directly.\n` +
        `- **Avoid**: Never construct a pooja room directly under a staircase, sharing a wall with a bathroom, or in the basement.` +
        (project && vastu ? `\n\n*Your Project Context:* Pooja room is oriented in **${vastu.orientationSummary?.poojaRoomDirection || 'North-East'}**.` : '');
    } else {
      reply = `🧭 **Vastu Shastra Principles for Residential Planning:**\n\n` +
        `- **North-East (Ishanya - Water)**: Pooja Room, Underground Sump, Open Lawn, Main Entrance.\n` +
        `- **South-East (Agneya - Fire)**: Kitchen, Electrical Meter / Inverter, Distribution Board.\n` +
        `- **South-West (Niruthi - Earth)**: Master Bedroom, Heavy Storage, Overhead Water Tank.\n` +
        `- **North-West (Vayavya - Air)**: Guest Bedroom, Children's Room, Pantry, Car Porch.\n` +
        `- **North (Kuber - Wealth)**: Living Room, Safe / Cash Locker, Open Balconies.\n` +
        `- **Centre (Brahmasthan)**: Must remain open, light, and free from heavy columns or toilets.\n\n` +
        (project && vastu ? `*Your Project Summary:* Overall Vastu Score is **${vastu.overallScore || 85}/100 (${vastu.grade || 'GOOD'})** with ${vastu.compliantRoomsCount || 8} compliant room zones.` : 'Ensure rooms align with elemental zones for optimum ventilation, daylight, and mental well-being.');
    }
  }
  // J. Concrete, Foundation & Structural Engineering (IS 456:2000)
  else if (userQuery.includes('concrete') || userQuery.includes('curing') || userQuery.includes('foundation') || userQuery.includes('footing') || userQuery.includes('column') || userQuery.includes('beam') || userQuery.includes('slab') || userQuery.includes('shuttering')) {
    reply = `🏗️ **Civil & Structural Engineering Standards (IS 456:2000):**\n\n` +
      `1. **Foundation & Footing Process**:\n` +
      `   - Site Demarcation & Centre-Line Layout using total station / chalk lines.\n` +
      `   - Soil Excavation down to hard strata (minimum 4 to 6 ft depth).\n` +
      `   - PCC 1:4:8 Bedding (Plain Cement Concrete, 100mm thickness) to provide a flat, clean base.\n` +
      `   - Trapezoidal or Isolated Footing Rebar cage with clear cover of **50 mm**.\n` +
      `   - Footing concrete casting using **M20 (1:1.5:3)** or **M25 (1:1:2)** with mechanical needle vibration.\n` +
      `   - Pedestal columns up to Plinth Beam level, backfilling, and compaction in 150mm layers.\n\n` +
      `2. **Curing Requirements & Methods**:\n` +
      `   - Minimum **10 days** for ordinary Portland cement (OPC) under normal conditions.\n` +
      `   - Minimum **14 to 21 days** when PPC / fly-ash cement is used, or during dry hot weather.\n` +
      `   - Continuous water ponding on horizontal RCC slabs; wet hessian cloth / gunny bags for vertical columns.\n\n` +
      `3. **Clear Cover for Reinforcement**:\n` +
      `   - Foundation Footings: **50 mm** | Columns: **40 mm** | Beams: **25 mm** | Slabs: **15 to 20 mm**\n\n` +
      `4. **Formwork / Shuttering Removal Time**:\n` +
      `   - Column sides & walls: **16 to 24 hours**\n` +
      `   - Slab soffits (props left under): **3 days** | Beam soffits: **7 days**\n` +
      `   - Slab spans up to 4.5m: **7 days**; spans > 6m: **14 to 21 days**.` +
      DISCLAIMER;
  }
  // K. Construction Stages & Milestones (Quick-action & general)
  else if (userQuery.includes('next activity') || userQuery.includes('next stage') || userQuery.includes('stage') || userQuery.includes('milestone') || userQuery.includes('timeline') || userQuery.includes('schedule')) {
    if (project && stages && stages.length > 0) {
      const inProg = stages.find(s => s.status === 'In Progress') || stages.find(s => s.status === 'Pending');
      const completed = stages.filter(s => s.status === 'Completed').length;
      reply = `📅 **Construction Milestone Schedule for ${project.name}:**\n\n` +
        `- **Milestones Completed**: **${completed} of ${stages.length}** stages\n` +
        `- **Currently Active Stage**: **${inProg?.code || 'STG-01'} — ${inProg?.name || 'Planning & Municipal Approvals'}**\n` +
        `- **Stage Progress**: ${inProg?.progressPercentage || 0}% completed\n` +
        `- **Estimated Budget for Stage**: ₹${inProg?.estimatedCost ? Number(inProg.estimatedCost).toLocaleString('en-IN') : '1,20,000'}\n` +
        `- **Assigned Team**: ${inProg?.assignedContractor || 'Civil Engineering Team'}\n` +
        `- **Next Required Materials**: ${inProg?.requiredMaterials?.map(m => `${m.name} (${m.quantity})`).join(', ') || 'Drawings & approval seals'}.\n\n` +
        `*Milestone Chain Overview:* Earthwork → Footings → Plinth Beam → Column Castings → Slab Casting → Brickwork → Plastering → Flooring → Electrical/Plumbing → Painting → Handover.` +
        DISCLAIMER;
    } else {
      reply = `📅 **Standard 21-Stage Residential Construction Timeline:**\n\n` +
        `1. **Pre-Construction**: Soil Testing, Architectural Blueprints, Municipal Sanctions.\n` +
        `2. **Substructure & Foundation**: Site Demarcation, Earthwork Excavation, PCC 1:4:8, Column Footings, Backfilling, Plinth Beam (DPC level).\n` +
        `3. **Superstructure & Curing**: RCC Columns, Shuttering, Beam & Slab Rebar Binding, Slab Concrete Casting (M20/M25), 14-21 Days Curing.\n` +
        `4. **Masonry & Plastering**: Red Brick / AAC Blockwork, Door/Window Frames, Internal 12mm Plastering, External 20mm Waterproof Plastering.\n` +
        `5. **MEP Services**: Electrical Concealed Conduiting, Plumbing CPVC/PVC Lines, Sanitary Drainage.\n` +
        `6. **Finishing**: Waterproofing Sunken Slabs, Floor Tiles / Marble, False Ceiling, 2-Coat Emulsion Paint, Joinery & Handover.` +
        DISCLAIMER;
    }
  }
  // L. Cost, Budget, and Package Comparisons
  else if (userQuery.includes('cost') || userQuery.includes('budget') || userQuery.includes('estimate') || userQuery.includes('package') || userQuery.includes('price') || userQuery.includes('rate') || userQuery.includes('sqft') || userQuery.includes('sq.ft')) {
    if (project && boq) {
      const diff = boq.budgetDifference || 0;
      const diffLabel = diff >= 0 ? `projected savings of ₹${Math.abs(diff).toLocaleString('en-IN')}` : `projected shortfall of ₹${Math.abs(diff).toLocaleString('en-IN')}`;
      reply = `💰 **Cost & Budget Breakdown (${boq.selectedPackage || 'MEDIUM'} Package):**\n\n` +
        `- **User Target Budget**: ₹${project.budget ? Number(project.budget).toLocaleString('en-IN') : '35,00,000'}\n` +
        `- **Total Estimated Cost**: ₹${boq.totalEstimatedCost ? Number(boq.totalEstimatedCost).toLocaleString('en-IN') : '32,25,000'}\n` +
        `- **Cost per Sq.Ft**: ₹${boq.costPerSqFt || 2150} / sq.ft for **${boq.totalBuiltUpAreaSqFt || 1500} sq.ft**\n` +
        `- **Financial Variance**: ${diffLabel}\n` +
        `- **Material Split**: ~65% (₹${boq.summary?.materialCost ? Number(boq.summary.materialCost).toLocaleString('en-IN') : '20,96,250'})\n` +
        `- **Labour Split**: ~35% (₹${boq.summary?.labourCost ? Number(boq.summary.labourCost).toLocaleString('en-IN') : '11,28,750'})\n\n` +
        `*Package Comparison for your house area:*\n` +
        `• **BASIC** (₹1,650/sq.ft): ₹${boq.packages?.basic?.totalCost ? Number(boq.packages.basic.totalCost).toLocaleString('en-IN') : '24,75,000'}\n` +
        `• **MEDIUM** (₹2,150/sq.ft): ₹${boq.packages?.medium?.totalCost ? Number(boq.packages.medium.totalCost).toLocaleString('en-IN') : '32,25,000'}\n` +
        `• **RICH** (₹2,850/sq.ft): ₹${boq.packages?.rich?.totalCost ? Number(boq.packages.rich.totalCost).toLocaleString('en-IN') : '42,75,000'}` +
        DISCLAIMER;
    } else {
      reply = `💰 **Residential Construction Rates & Packages (Telangana SoR 2026):**\n\n` +
        `1. **BASIC Package (₹1,500 – ₹1,750 / sq.ft)**:\n` +
        `   - Clay bricks, Fe 500 TMT, 2x2 vitrified tiles, flush doors, tractor emulsion paint.\n` +
        `2. **MEDIUM Package (₹2,000 – ₹2,350 / sq.ft)**:\n` +
        `   - Fe 550D TMT, 4x2 GVT glazed vitrified tiles, UPVC 3-track sliding windows, Teak main door, gypsum false ceiling with LED cove, modular kitchen.\n` +
        `3. **RICH / LUXURY Package (₹2,700 – ₹3,200+ / sq.ft)**:\n` +
        `   - Italian Statuario marble, acoustic UPVC/Aluminium windows, AAC blocks with thermal insulation, PU lacquered cabinetry, smart automation.\n\n` +
        `*Cost Allocation Ratio:* Materials account for ~65–70% of total expenditure; Labour accounts for ~30–35%.` +
        DISCLAIMER;
    }
  }
  // M. Bricks, Blocks & Masonry
  else if (userQuery.includes('brick') || userQuery.includes('aac') || userQuery.includes('block') || userQuery.includes('fly ash') || userQuery.includes('masonry')) {
    reply = `🧱 **Wall Masonry Comparison: Red Clay Bricks vs. AAC Blocks:**\n\n` +
      `1. **AAC Blocks (Autoclaved Aerated Concrete)**:\n` +
      `   - **Weight**: 3x lighter than clay bricks (reduces dead load on RCC columns & foundation).\n` +
      `   - **Thermal Insulation**: High thermal resistance; keeps indoor rooms cooler in summer.\n` +
      `   - **Speed & Precision**: Large format (600x200x150mm) speeds up construction by 40%.\n` +
      `   - **Jointing**: Uses thin-bed chemical mortar adhesive (eliminates thick cement-sand joints).\n` +
      `2. **Traditional Red Clay Bricks**:\n` +
      `   - **Strength**: High compressive strength and robust water resistance.\n` +
      `   - **Fasteners**: Ideal for heavy wall hangings and external perimeter boundaries.\n` +
      `   - **Mortar**: 1:6 cement-sand mortar for 9" external walls, 1:4 for 4.5" partitions with wire mesh reinforcement.\n\n` +
      `*Recommendation*: Use AAC blocks for upper floors to decrease structural weight and cut AC bills; use red bricks or solid concrete blocks for plinth walls and boundary walls.` +
      DISCLAIMER;
  }
  // N. Interior Design, Flooring & Finishes
  else if (userQuery.includes('interior') || userQuery.includes('flooring') || userQuery.includes('ceiling') || userQuery.includes('paint') || userQuery.includes('marble') || userQuery.includes('tile') || userQuery.includes('lighting')) {
    reply = `🎨 **Interior Architectural Design & Material Guidelines:**\n\n` +
      `1. **Flooring Options**:\n` +
      `   - **Glazed Vitrified Tiles (GVT 4x2 ft)**: Stain-resistant, minimal grout lines, highly durable (₹75 – ₹110/sq.ft).\n` +
      `   - **Imported Italian Marble**: Book-matched luxury look, requires periodic polish and sealer (₹350 – ₹650/sq.ft).\n` +
      `   - **Bathrooms & Kitchens**: Anti-skid matte porcelain tiles (R10 slip rating minimum).\n` +
      `2. **False Ceiling**:\n` +
      `   - Saint-Gobain 12.5mm Gypsum board with galvanized GI framework.\n` +
      `   - Hidden LED cove (3000K Warm White) combined with 4000K Natural White task downlights.\n` +
      `3. **Paints & Wall Finishes**:\n` +
      `   - Internal: 1 coat primer + 2 coats acrylic wall putty + 2 coats luxury emulsion (Asian Paints Royale / Berger Silk).\n` +
      `   - External: High-sheen elastomeric weatherproof exterior paint with anti-fungal silicones (Apex Ultima Protek).` +
      DISCLAIMER;
  }
  // O. Ventilation, Daylighting & Room Dimensions
  else if (userQuery.includes('ventilation') || userQuery.includes('window') || userQuery.includes('room size') || userQuery.includes('air') || userQuery.includes('light') || userQuery.includes('height')) {
    reply = `🪟 **Architectural Ventilation & Dimensional Standards (NBC 2016):**\n\n` +
      `- **Window-to-Floor Area Ratio**: Total window opening area should be at least **15% to 20%** of the room floor area for adequate natural lighting and air changes.\n` +
      `- **Cross-Ventilation**: Place openings on opposite or adjacent walls to establish a continuous air pressure gradient.\n` +
      `- **Standard Room Sizes (Residential)**:\n` +
      `  • Living Room: 14' x 16' to 16' x 20' (minimum 180 sq.ft)\n` +
      `  • Master Bedroom: 12' x 14' to 14' x 16' with attached bath (minimum 150 sq.ft)\n` +
      `  • Kitchen: 8' x 10' to 10' x 12' (minimum 80 sq.ft)\n` +
      `  • Bathroom / Toilet: 5' x 7' to 6' x 9' (minimum 35 sq.ft)\n` +
      `- **Clear Ceiling Height**: Finished floor to false ceiling minimum **9.5 to 10 feet** (2.9m – 3.0m).\n` +
      `- **Lintel Height**: Standard **7 feet** (2.1m) from finished floor level.` +
      DISCLAIMER;
  }
  // P. Unrelated / Out of Scope Queries
  else if (
    userQuery.includes('weather in') ||
    userQuery.includes('movie') ||
    userQuery.includes('song') ||
    userQuery.includes('poem') ||
    userQuery.includes('recipe for') ||
    userQuery.includes('cricket') ||
    userQuery.includes('football') ||
    userQuery.includes('capital of') ||
    userQuery.includes('who is') ||
    userQuery.includes('who won')
  ) {
    reply = "I am your specialized **AI House Planning & Construction Assistant**. My knowledge is strictly focused on residential architecture, floor plans, structural civil engineering, building materials, Vastu Shastra, cost estimation, and construction project management.\n\n" +
      "I am unable to answer general questions outside this domain. Please feel free to ask about your floor plans, steel/cement requirements, foundation design, Vastu guidelines, or construction packages!" +
      CONFIG_NOTE;
  }
  // Q. Default intelligent domain overview
  else {
    reply = `Hello! I am your AI Architectural & Construction Planning Assistant. I can assist you with:\n\n` +
      `1. **Structural & Materials**: Steel (Fe 550D), cement quantities, brick vs AAC block comparisons, concrete mix design, curing periods.\n` +
      `2. **Timeline & Scheduling**: Estimated completion duration, foundation through finishing stages, overlapping trades.\n` +
      `3. **Cost Reduction & Optimization**: Smart material choices, span adjustments, bulk procurement tactics.\n` +
      `4. **Vastu Shastra**: Cardinal zoning for kitchen, master bedroom, pooja room, main entrance, and remedies.\n` +
      `5. **BOQ & Cost Breakdown**: Itemized estimates, Telangana SoR rates, package comparisons (Basic vs Medium vs Rich).\n` +
      `6. **Interior & Exterior Design**: False ceiling, lighting, flooring materials, facade elevation treatments, color palettes.\n\n` +
      (project ? `*Context loaded for project:* **${project.name}** (${project.plot?.area || 1500} sq.ft, ${project.plot?.facingDirection || 'East'}-facing).\n` : '') +
      `Feel free to ask questions like:\n` +
      `• *"How many days does it take to complete my house?"*\n` +
      `• *"How can I reduce my construction cost?"*\n` +
      `• *"What is the difference between red bricks and AAC blocks?"*\n` +
      `• *"Explain the foundation construction process."*\n` +
      `• *"What happens if I change my plot dimensions?"*\n` +
      `• *"Suggest a modern exterior design with white and wooden colors."*\n` +
      `• *"What are the advantages of a false ceiling?"*` +
      DISCLAIMER +
      CONFIG_NOTE;
  }

  return {
    reply,
    source: 'expert_knowledge_engine'
  };
}

module.exports = { processChatbotMessage };
