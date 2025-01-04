import React from "react"
import Link from 'next/link';

export default async function CBAPage() {
  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        {/* Main Explanation Section */}
        <div className="neobrutalist-markdown-container">
          <h1 className="neobrutalist-title">
            Evidence-Based Regulatory Decisions
          </h1>
          <p className="neobrutalist-description mb-6">
            The Decentralized FDA uses rigorous cost-benefit analysis to ensure our regulatory framework maximizes societal well-being. Every decision is backed by quantitative modeling of health outcomes, economic impacts, and quality-of-life improvements.
          </p>
          
          <h2 className="neobrutalist-h2">Our Analytical Framework</h2>
          <ul className="neobrutalist-ul">
            <li className="neobrutalist-li">Comprehensive outcome modeling across multiple health dimensions</li>
            <li className="neobrutalist-li">Economic impact assessment including healthcare costs and productivity gains</li>
            <li className="neobrutalist-li">Quality-adjusted life year (QALY) calculations</li>
            <li className="neobrutalist-li">Population-level benefit projections</li>
            <li className="neobrutalist-li">Risk-adjusted return on investment for interventions</li>
          </ul>
        </div>

        {/* Simulation Links Section */}
        <div className="neobrutalist-markdown-container mt-8">
          <h2 className="neobrutalist-h2 mb-6">Outcome Simulations</h2>
          <p className="neobrutalist-description mb-8">
            Explore our interactive models that demonstrate the societal benefits of various health interventions:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/cba/muscle-mass" className="group neobrutalist-button bg-gradient-to-r from-[#FF3366] to-[#FF1493] text-white">
              <span>💪 Muscle Mass Impact Model</span>
            </Link>
            
            {/* Placeholder buttons for future simulations */}
            <div className="group neobrutalist-button bg-gradient-to-r from-[#00CC66] to-[#00FF00] opacity-50 cursor-not-allowed">
              <span>🧠 Cognitive Enhancement (Coming Soon)</span>
            </div>
            
            <div className="group neobrutalist-button bg-gradient-to-r from-[#6633FF] to-[#0066FF] opacity-50 cursor-not-allowed">
              <span>❤️ Cardiovascular Health (Coming Soon)</span>
            </div>
            
            <div className="group neobrutalist-button bg-gradient-to-r from-[#FF9933] to-[#FF6600] opacity-50 cursor-not-allowed">
              <span>🦴 Bone Density (Coming Soon)</span>
            </div>
            
            <div className="group neobrutalist-button bg-gradient-to-r from-[#9933FF] to-[#6600FF] opacity-50 cursor-not-allowed">
              <span>😴 Sleep Quality (Coming Soon)</span>
            </div>
            
            <div className="group neobrutalist-button bg-gradient-to-r from-[#33CC99] to-[#00FF99] opacity-50 cursor-not-allowed">
              <span>🏃 Metabolic Health (Coming Soon)</span>
            </div>
          </div>
        </div>

        {/* Methodology Section */}
        <div className="neobrutalist-markdown-container mt-8">
          <h2 className="neobrutalist-h2">Our Methodology</h2>
          <p className="neobrutalist-description">
            Each simulation incorporates:
          </p>
          <ul className="neobrutalist-ul">
            <li className="neobrutalist-li">Peer-reviewed research data</li>
            <li className="neobrutalist-li">Population-level statistics</li>
            <li className="neobrutalist-li">Economic impact calculations</li>
            <li className="neobrutalist-li">Quality of life assessments</li>
            <li className="neobrutalist-li">Long-term outcome projections</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
