const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const curatedLibrary = require('../data/curatedDesignLibrary.json');

const DESIGNS_DIR = path.join(__dirname, '../../uploads/designs');
if (!fs.existsSync(DESIGNS_DIR)) {
  fs.mkdirSync(DESIGNS_DIR, { recursive: true });
}

class ImageGenerationService {
  constructor() {
    this.provider = process.env.IMAGE_GENERATION_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'pollinations');
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    this.stabilityApiKey = process.env.STABILITY_API_KEY || null;
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY || null;
  }

  /**
   * Get active provider and config status
   */
  getProviderStatus() {
    return {
      activeProvider: this.provider,
      configuredProviders: {
        openai: Boolean(this.openaiApiKey),
        stability: Boolean(this.stabilityApiKey),
        huggingface: Boolean(this.hfApiKey),
        pollinations: true,
        fallbackReference: true,
      },
      disclaimer: "All generated visuals are conceptual architectural representations, not approved engineering construction drawings."
    };
  }

  /**
   * Build hyper-detailed Interior architectural prompt
   */
  buildInteriorPrompt(options, project) {
    const roomName = (options.roomType || 'living_room').replace(/_/g, ' ');
    const style = options.style || project?.preferences?.style || 'Contemporary';
    const budget = options.budgetTier || project?.selectedPackage || 'MEDIUM';
    const colors = (options.wallColors && options.wallColors.length > 0) 
      ? options.wallColors.join(', ') 
      : (project?.preferences?.interiorColours || 'Warm off-white and charcoal slate accent');
    const flooring = options.flooring || (budget === 'RICH' ? 'Italian Statuario marble with mirror polish' : 'Glazed vitrified tiles (4x2 ft)');
    const ceiling = options.ceiling || 'Saint-Gobain gypsum false ceiling with hidden warm 3000K LED cove lighting';
    const lighting = options.lighting || 'Recessed anti-glare downlights and architectural magnetic track spots';
    const furniture = options.furniture || 'Ergonomic luxury sectional seating and floating minimalist media console';
    const storage = options.storage || (roomName.includes('bedroom') ? 'Floor-to-ceiling built-in wardrobes with matte laminate finish' : 'Concealed cabinetry');
    const dims = options.dimensions?.length && options.dimensions?.width 
      ? `Room dimensions: ${options.dimensions.length}ft by ${options.dimensions.width}ft with 10ft clear ceiling height.` 
      : 'Spacious well-proportioned room with 10ft clear ceiling height.';
    const custom = options.customInstructions ? `Special requirements: ${options.customInstructions}.` : '';

    const regionalNote = style.includes('Traditional') 
      ? 'Features authentic Indian architectural craftsmanship, carved teakwood details, brass accent fixtures, and elegant jali screens.'
      : 'Features clean modern architectural detailing, warm ambient illumination, and premium Indian residential finishing.';

    return `Award-winning architectural interior photograph of a luxury Indian home ${roomName}. Style: ${style}, ${budget} tier finish. ${dims} Walls: ${colors}. Flooring: ${flooring}. Ceiling: ${ceiling}. Lighting: ${lighting}. Furniture & joinery: ${furniture}, ${storage}. ${regionalNote} ${custom} Natural daylight entering through large double-glazed windows, ultra-photorealistic, 8k resolution, Architectural Digest quality, ray tracing, sharp focus, perfectly straight vertical lines.`;
  }

  /**
   * Build hyper-detailed Exterior architectural elevation prompt
   */
  buildExteriorPrompt(options, project) {
    const style = options.style || options.elevationStyle || project?.preferences?.style || 'Modern Indian house';
    const floors = options.floors || project?.accommodation?.floors || 2;
    const plotInfo = project?.plot ? `${project.plot.width}ft wide by ${project.plot.length}ft deep plot` : 'residential villa plot';
    const colors = (options.exteriorColors && options.exteriorColors.length > 0)
      ? options.exteriorColors.join(', ')
      : 'Alabaster white base with dark charcoal slate projections and warm natural teak wood highlights';
    const facadeMat = options.facadeMaterial || 'Teak sandstone cladding panels and vertical weatherproof WPC louvers';
    const railing = options.balconyRailing || '12mm frameless toughened glass with stainless steel profile';
    const gate = options.boundaryGate || 'CNC laser cut steel entrance gate with wood-composite inlays';
    const entrance = options.entranceDoor || 'Grand double-height porch with carved solid teak main door';
    const lighting = options.lighting || 'Architectural exterior up-down facade spotlights and warm soffit strip illumination';
    const landscape = options.landscaping || 'Minimalist tropical front lawn, perimeter planter beds, and interlocking driveway pavers';
    const custom = options.customInstructions ? `Special architectural notes: ${options.customInstructions}.` : '';

    return `Front elevation architectural photograph of a luxury ${floors}-story ${style} residential villa on a ${plotInfo}. Front facade materials: ${facadeMat}. Color palette: ${colors}. Grand entrance: ${entrance}. Balcony: ${railing}. Boundary wall & entrance gate: ${gate}. Lighting: ${lighting}. Surrounding site & landscaping: ${landscape}. ${custom} Golden hour natural sunlight, clear blue sky with soft clouds, photorealistic 8k render, architectural photography, V-Ray 6, Octane render, rectilinear perspective.`;
  }

  /**
   * Save image buffer or base64 to uploads/designs/
   */
  saveImageBuffer(buffer, prefix = 'design') {
    const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
    const fullPath = path.join(DESIGNS_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    return {
      filename,
      relativeUrl: `/uploads/designs/${filename}`,
      fullPath
    };
  }

  /**
   * Generate SVG visual badge when offline or fallback mode
   */
  createCuratedVisualBadge(title, subtitle, type, style, colors = ['#1e293b', '#3b82f6', '#d97706']) {
    const c1 = colors[0] || '#1e293b';
    const c2 = colors[1] || '#3b82f6';
    const c3 = colors[2] || '#d97706';
    
    const svg = `<svg width="1024" height="768" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#090a0f" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${c2}" />
          <stop offset="100%" stop-color="${c3}" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="1024" height="768" fill="url(#bg)" />
      <rect width="1024" height="768" fill="url(#grid)" />
      
      <!-- Architectural Blueprint Lines -->
      <rect x="60" y="60" width="904" height="648" rx="24" fill="#0b1120" stroke="#1e293b" stroke-width="2" />
      <rect x="80" y="80" width="864" height="608" rx="16" fill="none" stroke="#334155" stroke-dasharray="8 8" stroke-width="1.5" />
      
      <!-- Decorative Architectural Frames -->
      <path d="M 120 220 L 500 220 L 500 560 L 120 560 Z" fill="${c1}" fill-opacity="0.25" stroke="${c2}" stroke-width="2" />
      <path d="M 520 220 L 900 220 L 900 560 L 520 560 Z" fill="${c1}" fill-opacity="0.15" stroke="${c3}" stroke-width="2" />
      
      <!-- Color Palette Circles -->
      <circle cx="150" cy="140" r="18" fill="${c1}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="200" cy="140" r="18" fill="${c2}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="250" cy="140" r="18" fill="${c3}" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Title & Badges -->
      <rect x="640" y="120" width="260" height="36" rx="8" fill="url(#accent)" />
      <text x="770" y="144" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1">
        ${type.toUpperCase()} VISUAL SPECIFICATION
      </text>
      
      <text x="120" y="270" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">${title}</text>
      <text x="120" y="310" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16">${subtitle}</text>
      <text x="120" y="350" fill="${c2}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Style Architecture: ${style}</text>
      
      <!-- Feature Checklist in Left Frame -->
      <text x="140" y="410" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="13">✦ High-Resolution Texture & Spec Mapping</text>
      <text x="140" y="445" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="13">✦ Itemized Bill of Quantities (BOQ) Integration</text>
      <text x="140" y="480" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="13">✦ Regional Telangana / IS 1200 Standards</text>
      <text x="140" y="515" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="13">✦ Parametric Material Rate Adjustments</text>
      
      <!-- Right Frame Spec -->
      <text x="540" y="270" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">Architectural Specifications</text>
      <text x="540" y="310" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Selected Finishes synchronized with Project BOQ engine.</text>
      <rect x="540" y="340" width="340" height="180" rx="12" fill="#0f172a" stroke="#334155" />
      <text x="560" y="380" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Material Composition:</text>
      <text x="560" y="410" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">• Surface Flooring: Vitrified GVT / Italian Slabs</text>
      <text x="560" y="435" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">• Wall Finish: Premium Acrylic Emulsion & Texture</text>
      <text x="560" y="460" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">• Ceiling: Saint-Gobain Cove with LED Profiles</text>
      <text x="560" y="485" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">• Millwork: Marine Plywood with Soft-Close</text>
      
      <!-- Disclaimer Footer -->
      <text x="512" y="660" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">
        Conceptual Visualization — Exact structural dimensions governed by Engineering Floor Plans & IS Standards.
      </text>
    </svg>`;

    const filename = `fallback_${type}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.svg`;
    const fullPath = path.join(DESIGNS_DIR, filename);
    fs.writeFileSync(fullPath, svg, 'utf8');
    return {
      filename,
      relativeUrl: `/uploads/designs/${filename}`,
      fullPath
    };
  }

  /**
   * Primary Image Synthesis via configured provider with automatic fallback
   */
  async generateDesignImage(prompt, type = 'interior', options = {}) {
    const seed = options.seed || Math.floor(Math.random() * 1000000);
    const provider = options.provider || this.provider;

    // 1. OpenAI DALL-E 3 Provider
    if (provider === 'openai' && this.openaiApiKey) {
      try {
        console.log(`[ImageGen] Generating via OpenAI DALL-E 3...`);
        const resp = await axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'b64_json'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        if (resp.data?.data?.[0]?.b64_json) {
          const buffer = Buffer.from(resp.data.data[0].b64_json, 'base64');
          const saved = this.saveImageBuffer(buffer, type);
          return {
            success: true,
            imageUrl: saved.relativeUrl,
            storagePath: saved.fullPath,
            provider: 'openai',
            model: 'dall-e-3',
            status: 'completed'
          };
        }
      } catch (err) {
        console.warn(`[ImageGen] OpenAI DALL-E 3 failed: ${err.message}. Falling back to Pollinations/Reference.`);
      }
    }

    // 2. Stability AI Provider
    if (provider === 'stability' && this.stabilityApiKey) {
      try {
        console.log(`[ImageGen] Generating via Stability AI...`);
        const resp = await axios.post(
          'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
          {
            text_prompts: [{ text: prompt, weight: 1 }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30
          },
          {
            headers: {
              'Authorization': `Bearer ${this.stabilityApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 60000
          }
        );

        if (resp.data?.artifacts?.[0]?.base64) {
          const buffer = Buffer.from(resp.data.artifacts[0].base64, 'base64');
          const saved = this.saveImageBuffer(buffer, type);
          return {
            success: true,
            imageUrl: saved.relativeUrl,
            storagePath: saved.fullPath,
            provider: 'stability',
            model: 'sdxl-1.0',
            status: 'completed'
          };
        }
      } catch (err) {
        console.warn(`[ImageGen] Stability AI failed: ${err.message}. Falling back.`);
      }
    }

    // 3. Pollinations.ai FLUX Generative API (Direct live AI synthesis without requiring paid key)
    try {
      console.log(`[ImageGen] Generating via Pollinations FLUX Engine (seed: ${seed})...`);
      const encodedPrompt = encodeURIComponent(prompt.slice(0, 800));
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;

      const imgResp = await axios.get(pollinationsUrl, {
        responseType: 'arraybuffer',
        timeout: 45000
      });

      if (imgResp.status === 200 && imgResp.data && imgResp.data.length > 1000) {
        const buffer = Buffer.from(imgResp.data);
        const saved = this.saveImageBuffer(buffer, type);
        return {
          success: true,
          imageUrl: saved.relativeUrl,
          storagePath: saved.fullPath,
          provider: 'pollinations',
          model: 'flux',
          status: 'completed'
        };
      }
    } catch (err) {
      console.warn(`[ImageGen] Live synthesis endpoint notice: ${err.message}. Engaging curated reference visualizer.`);
    }

    // 4. Curated Architectural Reference Fallback
    const title = options.title || `${options.style || 'Contemporary'} ${type === 'interior' ? (options.roomType || 'Living Room') : 'Exterior Facade'}`;
    const subtitle = options.subtitle || "Architectural Reference & Material Specification";
    const colors = options.wallColors || options.exteriorColors || ['#1e293b', '#3b82f6', '#d97706'];

    const visual = this.createCuratedVisualBadge(title, subtitle, type, options.style || 'Contemporary', colors);
    return {
      success: true,
      imageUrl: visual.relativeUrl,
      storagePath: visual.fullPath,
      provider: 'curated-reference',
      model: 'architectural-spec-v1',
      status: 'fallback',
      message: 'Design visual specifications loaded. Configure OPENAI_API_KEY or STABILITY_API_KEY in backend/.env for custom live API generation.'
    };
  }

  /**
   * Generate multiple alternatives for side-by-side comparison
   */
  async generateAlternatives(basePrompt, type, options, count = 3) {
    const alternatives = [];
    const baseSeed = Math.floor(Math.random() * 900000);

    for (let i = 0; i < count; i++) {
      const altSeed = baseSeed + (i * 1337);
      const altPrompt = `${basePrompt} Alternative architectural perspective #${i + 1}.`;
      try {
        const result = await this.generateDesignImage(altPrompt, type, { ...options, seed: altSeed });
        alternatives.push({
          id: `alt_${i + 1}_${altSeed}`,
          imageUrl: result.imageUrl,
          prompt: altPrompt,
          seed: altSeed,
          provider: result.provider,
          status: result.status
        });
      } catch (e) {
        console.error(`Error generating alternative #${i + 1}:`, e);
      }
    }

    return alternatives;
  }

  /**
   * Derive itemized material cost specifications for a room or exterior selection
   */
  computeItemizedMaterials(type, key, style = 'Modern', customDims = null) {
    let libSection = type === 'interior' ? curatedLibrary.interior : curatedLibrary.exterior;
    let specObj = null;

    if (type === 'interior') {
      let roomObj = libSection[key] || libSection[Object.keys(libSection)[0]];
      specObj = roomObj ? (roomObj[style] || roomObj[Object.keys(roomObj)[0]]) : null;
    } else {
      specObj = libSection[key] || libSection[Object.keys(libSection)[0]];
    }

    if (!specObj) {
      return {
        estimatedCost: type === 'exterior' ? 220000 : 120000,
        materials: [
          { name: 'Standard Surface Materials', spec: 'Vitrified / Cladding', qty: 1, unit: 'lump_sum', unitCost: type === 'exterior' ? 220000 : 120000, totalCost: type === 'exterior' ? 220000 : 120000 }
        ]
      };
    }

    let materials = JSON.parse(JSON.stringify(specObj.materials || []));

    // If user provided custom dimensions, scale the area-based items appropriately
    if (customDims?.areaSqFt && customDims.areaSqFt > 0) {
      materials = materials.map(m => {
        if (m.unit === 'sq.ft') {
          const scaledQty = Math.round(customDims.areaSqFt * (m.qty / 200 || 1));
          return {
            ...m,
            qty: scaledQty,
            totalCost: scaledQty * m.unitCost
          };
        }
        return m;
      });
    }

    const totalCost = materials.reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return {
      estimatedCost: totalCost,
      materials
    };
  }
}

module.exports = new ImageGenerationService();
