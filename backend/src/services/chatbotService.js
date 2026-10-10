const axios = require('axios');

/**
 * Intelligent Context-Aware House Planning Chatbot Engine
 */
async function processChatbotMessage({ message, project, floorPlan, vastu, boq, stages, expenses, history }) {
  const userQuery = (message || '').toLowerCase().trim();

  // 1. If OpenAI or Gemini API Key is configured, attempt live LLM call
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey || openaiKey) {
    try {
      const contextPrompt = `
You are the AI Architectural & Construction Assistant for a residential project.
Project Information:
- Name: ${project?.name || 'My House'}
- Location: ${project?.location || 'Warangal'}
- Plot Dimensions: ${project?.plot?.width || 30}' x ${project?.plot?.length || 50}' (${project?.plot?.area || 1500} sq.ft)
- Facing: ${project?.plot?.facingDirection || 'East'}
- Built-up Area: ${boq?.totalBuiltUpAreaSqFt || 1500} sq.ft
- Budget: ₹${project?.budget?.toLocaleString('en-IN') || '35,00,000'}
- Selected Package: ${boq?.selectedPackage || 'MEDIUM'}
- Estimated Total Cost: ₹${boq?.totalEstimatedCost?.toLocaleString('en-IN') || '32,25,000'} (Budget Diff: ₹${boq?.budgetDifference?.toLocaleString('en-IN')})
- Vastu Score: ${vastu?.overallScore || 85}/100 (${vastu?.grade || 'GOOD'})
- Construction Stages Completed: ${stages ? stages.filter(s => s.status === 'Completed').length : 0} of ${stages ? stages.length : 21}

User Question: "${message}"

Please provide a helpful, concise, engineering-informed response. If giving advice, clarify that structural blueprints must be certified by a licensed structural engineer before construction.
`;

      if (openaiKey) {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an intelligent architectural and construction assistant.' },
            { role: 'user', content: contextPrompt }
          ],
          temperature: 0.7
        }, {
          headers: { Authorization: `Bearer ${openaiKey}` }
        });
        return {
          reply: response.data.choices[0].message.content,
          source: 'openai_gpt4o'
        };
      }
    } catch (err) {
      console.warn('External LLM error, falling back to local expert system:', err.message);
    }
  }

  // 2. Local Architectural Expert Engine (Rule-based NLP & Context Matching)
  let reply = '';

  if (userQuery.includes('plot') || userQuery.includes('dimension') || userQuery.includes('area') || userQuery.includes('setback')) {
    reply = `Your plot measures **${project?.plot?.width}' Width x ${project?.plot?.length}' Length**, with a gross plot area of **${project?.plot?.area} sq.ft**.\n\n` +
      `- Facing Direction: **${project?.plot?.facingDirection || 'East'}**\n` +
      `- Front Setback: **${project?.plot?.setbacks?.front || 5} ft** | Rear: **${project?.plot?.setbacks?.rear || 3} ft**\n` +
      `- Allowable Building Footprint: **${(project?.plot?.width || 30) - 6}' x ${(project?.plot?.length || 50) - 8}'** (~${boq?.totalBuiltUpAreaSqFt || 1500} sq.ft total built-up across ${project?.accommodation?.floors || 1} floor(s)).`;
  }
  else if (userQuery.includes('vastu') || userQuery.includes('direction') || userQuery.includes('orientation') || userQuery.includes('compass')) {
    reply = `Your current floor plan has an overall Vastu Compliance Score of **${vastu?.overallScore || 88}/100 (${vastu?.grade || 'GOOD'})**.\n\n` +
      `- **Main Entrance**: Facing ${vastu?.orientationSummary?.entranceDirection || 'North-East'} (Optimal morning light & energy flow).\n` +
      `- **Kitchen**: Allocated in ${vastu?.orientationSummary?.kitchenDirection || 'South-East (Agneya)'} zone, aligning with the Fire element.\n` +
      `- **Master Bedroom**: Situated in ${vastu?.orientationSummary?.masterBedroomDirection || 'South-West (Niruthi)'} zone for earth-element stability.\n` +
      `- **Pooja Room**: Oriented in ${vastu?.orientationSummary?.poojaRoomDirection || 'North-East (Ishanya)'} zone.`;
  }
  else if (userQuery.includes('cost') || userQuery.includes('budget') || userQuery.includes('estimate') || userQuery.includes('price') || userQuery.includes('sqft')) {
    const diff = boq?.budgetDifference || 0;
    const diffStatus = diff >= 0 ? `projected savings of ₹${Math.abs(diff).toLocaleString('en-IN')}` : `projected shortfall of ₹${Math.abs(diff).toLocaleString('en-IN')}`;
    reply = `Here is your financial overview for the **${boq?.selectedPackage || 'MEDIUM'}** package:\n\n` +
      `- **Total Target Budget**: ₹${project?.budget?.toLocaleString('en-IN') || '35,00,000'}\n` +
      `- **Total Estimated Cost**: ₹${boq?.totalEstimatedCost?.toLocaleString('en-IN') || '32,25,000'}\n` +
      `- **Cost per Sq.Ft**: ₹${boq?.costPerSqFt || 2150} / sq.ft\n` +
      `- **Variance**: ${diffStatus}\n` +
      `- **Material Cost**: ₹${boq?.summary?.materialCost?.toLocaleString('en-IN')} | **Labour Cost**: ₹${boq?.summary?.labourCost?.toLocaleString('en-IN')}.`;
  }
  else if (userQuery.includes('package') || userQuery.includes('basic') || userQuery.includes('medium') || userQuery.includes('rich') || userQuery.includes('tier')) {
    reply = `We provide 3 customizable construction packages for your **${boq?.totalBuiltUpAreaSqFt || 1500} sq.ft** house:\n\n` +
      `1. **BASIC** (₹1,650/sq.ft → ₹${boq?.packages?.basic?.totalCost?.toLocaleString('en-IN')}): 2x2 vitrified tiles, clay bricks, standard flush doors, tractor emulsion.\n` +
      `2. **MEDIUM [Selected]** (₹2,150/sq.ft → ₹${boq?.packages?.medium?.totalCost?.toLocaleString('en-IN')}): 4x2 GVT tiles, UPVC windows, solid Teak main door, modular kitchen, false ceiling.\n` +
      `3. **RICH / LUXURY** (₹2,850/sq.ft → ₹${boq?.packages?.rich?.totalCost?.toLocaleString('en-IN')}): Italian marble, smart home WiFi automation, AAC blocks, PU polish, walk-in glass wardrobes.`;
  }
  else if (userQuery.includes('stage') || userQuery.includes('progress') || userQuery.includes('next') || userQuery.includes('timeline') || userQuery.includes('step')) {
    const inProg = (stages || []).find(s => s.status === 'In Progress');
    const completed = (stages || []).filter(s => s.status === 'Completed').length;
    reply = `Your construction progress status:\n\n` +
      `- **Stages Completed**: ${completed} of ${stages?.length || 21}\n` +
      `- **Currently Active Stage**: **${inProg?.code || 'STG-01'} - ${inProg?.name || 'Planning & Approvals'}** (${inProg?.progressPercentage || 0}% completed)\n` +
      `- **Assigned Contractor**: ${inProg?.assignedContractor || 'Civil Engineering Team'}\n` +
      `- **Next Required Materials**: ${inProg?.requiredMaterials?.map(m => `${m.name} (${m.quantity})`).join(', ') || 'Drawings & approval stamps'}.`;
  }
  else if (userQuery.includes('steel') || userQuery.includes('cement') || userQuery.includes('brick') || userQuery.includes('tile') || userQuery.includes('material')) {
    const steel = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-04');
    const cement = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-03');
    const tiles = (boq?.boqLineItems || []).find(i => i.code === 'BOQ-10');
    reply = `Key structural materials calculated for your built-up area:\n\n` +
      `- **Fe 550D TMT Steel**: ${steel?.purchasableQuantity || 5800} kg (Total: ₹${steel?.totalCost?.toLocaleString('en-IN')})\n` +
      `- **OPC 53 Cement**: ${cement?.purchasableQuantity || 630} bags (Total: ₹${cement?.totalCost?.toLocaleString('en-IN')})\n` +
      `- **Floor Tiles**: ${tiles?.purchasableQuantity || 1200} sq.ft (Total: ₹${tiles?.totalCost?.toLocaleString('en-IN')} with 7% wastage allowance).`;
  }
  else {
    reply = `Hello! I am your AI Architectural & Construction Planning Assistant. I can help you with:\n\n` +
      `1. **Floor Plan Insights**: Layout configuration, room dimensions & circulation corridors.\n` +
      `2. **Vastu Analysis**: Cardinal orientation, room placements & remedies.\n` +
      `3. **BOQ & Cost Breakdown**: Itemized materials, labour rates, and Telangana regional pricing.\n` +
      `4. **Package Comparison**: Basic vs Medium vs Rich finishes.\n` +
      `5. **Construction Schedule**: 21 milestone dependencies & next eligible activities.\n\n` +
      `Feel free to ask questions like *"What is my steel and cement requirement?"*, *"How compliant is my kitchen in Vastu?"*, or *"Explain the next construction stage."*`;
  }

  return {
    reply,
    source: 'expert_rule_engine'
  };
}

module.exports = { processChatbotMessage };
