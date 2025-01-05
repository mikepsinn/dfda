export const reportSections = {
    methodology: {
        title: "Methodology Notes",
        points: [
            "All calculations use validated equations from peer-reviewed research",
            "Health outcomes are based on conservative estimates from meta-analyses",
            "Economic impact includes direct healthcare savings and indirect productivity gains",
            "Risk reductions are calculated using linear scaling with established upper bounds"
        ]
    },
    limitations: {
        title: "Limitations",
        points: [
            "Individual results may vary based on age, gender, and baseline health status",
            "Long-term adherence to intervention maintenance not considered",
            "Intervention costs not included in economic calculations",
            "Results are based on population-level statistics and may not reflect individual outcomes",
            "Measurements in source studies may have some methodological limitations"
        ]
    },
    statisticalValidation: {
        title: "Statistical Validation",
        description: "The predictions in our model are based on robust statistical analyses using:",
        points: [
            "Modified Poisson regression with robust estimation",
            "Cox proportional hazards regression"
        ],
        covariates: {
            title: "Adjustment for multiple covariates including:",
            points: [
                "Age, sex, race/ethnicity",
                "Smoking status",
                "Medical history",
                "Central obesity",
                "Cardiovascular risk factors",
                "Glucose metabolism measures"
            ]
        }
    }
}; 