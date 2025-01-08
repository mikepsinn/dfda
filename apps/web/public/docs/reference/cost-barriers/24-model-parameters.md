### 2.4 Model Parameters

The clinical trial cost/decision-making model described above requires numerous data points, including phase durations, success probabilities, expected revenues, and a discount rate, as well as a full range of itemized costs associated with clinical trials, broken down by phase and therapeutic area. The model uses a real annual discount rate of 15 percent based on input from interviews conducted with drug sponsors as default, and we were able to obtain some of the other data needed from the available clinical research literature. Phase durations were one such parameter. Though they are not differentiated by therapeutic area, DiMasi, Hansen, & Grabowski (2003) provide mean phase lengths of 21.6 months (1.8 years) for Phase 1, 25.7 months (2.1 years) for Phase 2, and 30.5 months (2.5 years) for Phase 3. The NDA/BLA review time, as we are defining it,<sup>6</sup> includes the time from first submission of an NDA/BLA to regulatory marketing approval, and comes from DiMasi, Grabowski, & Vernon (2004). Trial phase times generally do not reflect differences between therapeutic areas; however, therapeutic-area-specific NDA/BLA review times were available and used for a select list of therapeutic areas.

Clinical trial success probabilities are available from two recent studies, one conducted by DiMasi and colleagues (Tufts University) in 2010 (DiMasi, Feldman, Seckler, & Wilson, 2010), and another one conducted by BioMedTracker in 2011(Hay, Rosenthal, Thomas, & Craighead, 2011). The two studies, however, provide different success rate estimates—for example, DiMasi, et al. (2010) found an overall success rate of 19 percent, while Hay and colleagues (2011) arrived at nine percent. The differences in the two studies can be attributable to the fact that they were drawing from different pools of data. DiMasi, et al. (2010) collected data on 1,738 drugs that entered Phase 1 between 1993 and 2004 and were developed by the 50 largest pharmaceutical companies. The BioMedTracker study covered 4,275 drugs from biotechnology and pharmaceutical companies of all sizes. The drugs included were in any phase of development between October 2003 and December 2010 (Hay, Rosenthal, Thomas, & Craighead, 2011).

As the BioMedTracker study was more recent and included more drugs and a broader range of companies, we opted to use the success probabilities reported by BioMedTracker in our model. These success probabilities were broken down by clinical trial phase and, for Phase 2 and Phase 3, by therapeutic area as well. For Phase 1, we used 67 percent for all therapeutic areas. For Phases 2 and 3 and the NDA/BLA review phase, we used therapeutic-area-specific percentages where available and general success probabilities (41, 65, and 83 percent, respectively) for therapeutic areas for which no specific probabilities were reported. All probabilities used in the model were for lead indications.

In order to construct the model’s “baseline scenario,” we obtained itemized clinical trial cost data from Medidata Solutions (hereafter “Medidata”), which compiles data from a portfolio of CRO contracts, investigator grants/contracts, and clinical trial protocols. Medidata Grants Manager’s database, PICAS<sup>®</sup> , and CRO Contractor’s database, CROCAS<sup>®</sup> , contain numerous data elements derived from actual negotiated contracts, and these resources are widely used by pharmaceutical companies, CROs, and academic researchers to identify prevailing rates for trial planning, budget development, and grant negotiation (Medidata Solutions, 2012). We obtained the number of clinical investigator sites per study/protocol from Medidata Insights™, based on 7,000 study protocols that allows numerous views of study performance metrics on demand, by therapeutic area, study phase, geography and more.

The custom tabulation received from Medidata contained means and variances for a wide range of clinical trial cost elements, including study-level costs (such as IRB approvals and source data verification (SDV) costs), patient-level costs (such as recruitment and clinical procedure costs), and sitelevel costs (such as monitoring and project management). Number of planned patients per site and number of sites per study were also provided. A complete list of these data elements can be found in Appendix B, along with more detailed descriptions of each field, unit specifications, and sources. The data are from 2004 and later and have not been adjusted for inflation by Medidata. As the data points represent averages across this range of time and cannot be assigned specific years, we were unable to adjust them for inflation, which is one of the study limitations.

Medidata provided means and variances of costs by trial phase (Phases 1 through 4), geographic region (U.S., global, and rest of world), and therapeutic area. For the purposes of this analysis, we focused on the data points specific to U.S. trials. The therapeutic areas for which Medidata provided data were: anti-Infective, cardiovascular, central nervous system, dermatology, devices and diagnostics<sup>7</sup> , endocrine, gastrointestinal, genitourinary System, hematology, immunomodulation, oncology, ophthalmology, pain and anesthesia, pharmacokinetics<sup>8</sup> , and respiratory system. To the extent possible, we attempted to match the success probabilities by therapeutic area (from BioMedTracker) to the therapeutic area categories used by Medidata. Some additional data cleaning steps were performed using the statistical software STATA; these are outlined in Appendix E.

On the revenue side, we used an estimate from a study by DiMasi, Grabowski, & Vernon, (2004), which reports worldwide sales revenues over the product life cycle for new drugs approved in the United States during the period from 1990 to 1994. Figures were available for some specific indications; for the others, we used the reported figure for “All Drugs.” The numbers reported by DiMasi, Grabowski, & Vernon (2004) are NPVs, discounted at 11 percent to the launch year; however, they are in year 2000 dollars. Therefore, we inflated the revenue figures to 2008 dollars (the midpoint between 2004 and 2012, the range covered by the itemized cost data) using the producer price index for commodities in the category “Drugs and Pharmaceuticals” from the Bureau of Labor Statistics (BLS) (series WPU063).

---

<sup>6</sup> From FDA’s perspective, each submission has a set time period (priority or non-priority review) that does not include time between submissions; however that time is included in our definition of the NDA/BLA review phase time for the purposes of this analysis.

<sup>7</sup> The “Devices and Diagnostics” category includes any industry-sponsored studies where a device or drug delivery system is being studied instead of a drug. Among the devices included in this category are stents, implants, joint replacements, inhalers, and blood sugar monitoring devices.

<sup>8</sup> Pharmacokinetic (PK) studies are often conducted at the discovery or candidate selection stages of a development program. These studies look at the mechanisms of absorption and distribution of a drug candidate as well as the rate at which a drug action begins and the duration of this effect.

## 3 Analysis of Costs

We worked closely with Medidata to determine the appropriate methodology for aggregating the itemized costs that characterize the overall cost of a clinical trial. To obtain totals for each individual trial within a given phase, we grouped the cost components into per-study costs, per-patient costs, and per-site costs, where:

- Per-study costs is the sum of:
    - _Data Collection, Management and Analysis Costs (per study);_
    - _Cost Per Institutional Review Board (IRB) Approval × Number of IRB Approvals (per study);_
    - _Cost Per IRB Amendment × Number of IRB Amendments (per study);_
    - _SDV Cost (per data field) × Number of SDV Fields (per study); and_
    - _The total of all per-site costs listed below, multiplied by Number of Sites (per study);_
- _​_Per-site costs is the sum of:
    - _The total of all per-patient costs listed below, multiplied by Number of Planned Patients (per site);_
    - _Site Recruitment Costs (per site);_
    - _Site Retention Costs (per month) × Number of Site Management Months;_
    - _Administrative Staff Costs (per month) × Number of Project Management Months; and_
    - _Site Monitoring Costs (per day) × Number of Site Monitoring Days;_
- _​_Per-patient costs is the sum of:
    - _Patient Recruitment Costs (per patient);_
    - _Patient Retention Costs (per patient);_
    - _Registered Nurse (RN)/Clinical Research Associate (CRA) Costs (per patient);_
    - _Physician Costs (per patient);_
    - _Clinical Procedure Total (per patient); and_
    - _Central Lab Costs (per patient);_

_​_To arrive at a best approximation of the cost total for the trial, two additional costs had to be added in: site overhead and all other additional costs not captured in the itemized categories listed above. We first added site overhead as a percentage of the sum of the above per-study costs (roughly 20 to 27 percent of the above per-study costs as estimated by Medidata). <sup>9</sup> According to Medidata, the computed per-study costs plus the 25 percent site overhead only accounts for approximately 70 percent of total trial costs. Still missing from this total are costs for sponsors to run the study and other costs not captured elsewhere. Thus, we estimated an additional cost category, “_All Other Costs_” as 30 percent of the sum of computed per-study costs and the 25 percent site overhead to ensure accuracy of our totals.

We applied the cost aggregation methodology outlined above to all trials within Phases 1, 2, 3, and 4. In the operational model developed, if the user specifies that the study will include more than one trial per phase, the cost totals for each trial are summed to get an overall total cost for the phase.

Adding the lengths of time associated with each trial within a phase was somewhat more complex, as there are a range of possibilities. One possibility is that all trials within a given phase are completed concurrently, in which case the total length of time for the phase would be equal to the maximum length of time needed to complete any individual trial within that phase. For example, if there were two Phase 2 trials, and one took 1.5 years, while the other took 2 years, the total length of Phase 2 would be 2 years, assuming the trials were completed at the same time. At the other extreme end of the spectrum, the trials within a phase might be completed sequentially with no overlap, in which case the lengths of time specified would need to be summed to arrive at the total phase length. In the previous example, this would mean that the total length of Phase 2 is 1.5 plus 2, or 3.5 years. To take into account both extremes and all possibilities in between, we assumed that the phase length in years across all trials associated with a given phase is the average of these two measures (the maximum trial length specified and the total of all lengths specified). It should be noted that if only one trial is specified for a given phase in the operational model, this average will simply be equal to the length given for that trial.

The operational model discounts the total costs for each phase back to Year 0 (before Phase 1 trials are started) using the real annual discount rate (15 percent for the default scenario). Further, the model assumes that all costs associated with each phase are incurred at the start of the phase; therefore, Phase 1 costs are not discounted, Phase 2 costs are discounted over the length of Phase 1, Phase 3 costs are discounted over the combined lengths of Phases 1 and 2, and so forth.

While we apply discounting to trial costs in the operational model, the analysis presented below is based on raw (i.e., un-discounted) cost figures. Further, we exclude Devices & Diagnostics as well as Pharmacokinetics categories from the analysis below as these are not within the scope of this study.<sup>10</sup>

---

<sup>9</sup> Site overhead is not always applied to all costs in a negotiated clinical investigator contract by the clinical site. In some cases, the site may negotiate overhead only on certain portions of the contract such as clinical procedures. Thus, 25 percent of total per-study costs is likely to be an overestimate of actual overhead costs per study.

<sup>10</sup> Because the data were available for both categories, we left them in the operational model.


