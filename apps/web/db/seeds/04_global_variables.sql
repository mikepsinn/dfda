-- Global variables seed file
-- Contains seed data for global variables like side effects, etc.

-- Insert global variables for symptoms, conditions, and side effects
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('nausea', 'Nausea', 'Feeling of sickness with an inclination to vomit', 'health-and-physiology', 'zero-to-ten-scale', '🤢'),
('headache', 'Headache', 'Pain in the head or upper neck', 'health-and-physiology', 'zero-to-ten-scale', '🤕'),
('dizziness', 'Dizziness', 'Lightheadedness, feeling faint or unsteady', 'health-and-physiology', 'zero-to-ten-scale', '🌀'),
('fatigue', 'Fatigue', 'Extreme tiredness resulting from mental or physical exertion', 'health-and-physiology', 'zero-to-ten-scale', '😴'),
('stomach-upset', 'Stomach Upset', 'Discomfort or pain in the stomach', 'health-and-physiology', 'zero-to-ten-scale', '🤯'),
('dry-cough', 'Dry Cough', 'Cough that doesn''t produce phlegm or mucus', 'health-and-physiology', 'zero-to-ten-scale', '🤧'),
('rash', 'Rash', 'Area of irritated or swollen skin', 'health-and-physiology', 'zero-to-ten-scale', '🤕'),
('insomnia', 'Insomnia', 'Difficulty falling or staying asleep', 'health-and-physiology', 'zero-to-ten-scale', '😳'),
('type-2-diabetes', 'Type 2 Diabetes', 'A chronic condition that affects the way the body processes blood sugar (glucose).', 'health-and-physiology', 'boolean', '🍭'),
('hypertension', 'Hypertension', 'High blood pressure is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems.', 'health-and-physiology', 'boolean', '🩺'),
('rheumatoid-arthritis', 'Rheumatoid Arthritis', 'An autoimmune and inflammatory disease, which means that your immune system attacks healthy cells in your body by mistake, causing inflammation in the affected parts of the body.', 'health-and-physiology', 'boolean', '🦴'),
('major-depressive-disorder', 'Major Depressive Disorder', 'A mental health disorder characterized by persistently depressed mood or loss of interest in activities, causing significant impairment in daily life.', 'mental-and-emotional-state', 'zero-to-ten-scale', '😔'),
('asthma', 'Asthma', 'A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult and triggering coughing, wheezing and shortness of breath.', 'health-and-physiology', 'zero-to-ten-scale', '🫁'),
('pain', 'Pain', 'Physical discomfort caused by illness or injury, which can be acute or chronic.', 'health-and-physiology', 'zero-to-ten-scale', '😩'),
('hyperlipidemia', 'Hyperlipidemia', 'Elevated levels of lipids (fats), such as cholesterol and triglycerides, in the blood.', 'health-and-physiology', 'boolean', '🩸'),
('mixed-hyperlipidemia', 'Mixed Hyperlipidemia', 'Elevated levels of both cholesterol and triglycerides in the blood.', 'health-and-physiology', 'boolean', '🩸'),
('low-back-pain', 'Low Back Pain', 'Pain or discomfort felt in the lower back region.', 'health-and-physiology', 'zero-to-ten-scale', '🤕'),
('copd', 'COPD', 'Chronic Obstructive Pulmonary Disease, a group of lung diseases that block airflow and make it difficult to breathe.', 'health-and-physiology', 'zero-to-ten-scale', '🫁'),
('atrial-fibrillation', 'Atrial Fibrillation', 'An irregular and often rapid heart rate that can increase risk of stroke, heart failure and other heart-related complications.', 'health-and-physiology', 'boolean', '❤️'),
('abdominal-pain', 'Abdominal Pain', 'Pain felt anywhere between the chest and groin.', 'health-and-physiology', 'zero-to-ten-scale', '😖'),
('uti', 'Urinary Tract Infection', 'An infection in any part of the urinary system – kidneys, ureters, bladder and urethra.', 'health-and-physiology', 'zero-to-ten-scale', '🚻'),
('anxiety', 'Anxiety Disorder', 'Feelings of worry, anxiety, or fear that are strong enough to interfere with one''s daily activities.', 'mental-and-emotional-state', 'zero-to-ten-scale', '😟'),
('gerd', 'GERD', 'Gastroesophageal Reflux Disease, a digestive disorder that affects the lower esophageal sphincter (LES).', 'health-and-physiology', 'zero-to-ten-scale', '🔥'),
('chest-pain', 'Chest Pain', 'Pain felt anywhere in the chest.', 'health-and-physiology', 'zero-to-ten-scale', '😫'),
('upper-respiratory-infection', 'Upper Respiratory Infection', 'Infection of the nose, sinuses, pharynx, or larynx (e.g., common cold).', 'health-and-physiology', 'zero-to-ten-scale', '🤧'),
('pneumonia', 'Pneumonia', 'Infection that inflames air sacs in one or both lungs, which may fill with fluid.', 'health-and-physiology', 'zero-to-ten-scale', '🫁'),
('acute-bronchitis', 'Acute Bronchitis', 'Inflammation of the lining of bronchial tubes, which carry air to and from the lungs.', 'health-and-physiology', 'zero-to-ten-scale', '🫁'),
('knee-pain', 'Knee Pain', 'Pain originating from the knee joint.', 'health-and-physiology', 'zero-to-ten-scale', '🦵'),
('heart-failure', 'Heart Failure', 'A chronic condition in which the heart doesn''t pump blood as well as it should.', 'health-and-physiology', 'zero-to-ten-scale', '💔'),
('hypothyroidism', 'Hypothyroidism', 'Condition in which the thyroid gland doesn''t produce enough crucial hormones.', 'health-and-physiology', 'boolean', '🦋'),
('vitamin-d-deficiency', 'Vitamin D Deficiency', 'Lack of adequate Vitamin D in the body.', 'health-and-physiology', 'boolean', '☀️'),
('long-covid', 'Long COVID', 'Long-term symptoms following a COVID-19 infection.', 'health-and-physiology', 'zero-to-ten-scale', '⏳'),
('covid-19', 'COVID-19', 'Infection caused by the SARS-CoV-2 virus.', 'health-and-physiology', 'zero-to-ten-scale', '🦠');

-- Insert global variables for vital signs
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('blood-pressure', 'Blood Pressure', 'Pressure of circulating blood against the walls of blood vessels', 'health-and-physiology', 'millimeters-of-mercury', '💊'),
('heart-rate', 'Heart Rate', 'Number of times your heart beats per minute', 'health-and-physiology', 'per-minute', '❤️'),
('blood-glucose', 'Blood Glucose', 'Concentration of glucose in the blood', 'health-and-physiology', 'milligrams-per-deciliter', '🍭'),
('body-temperature', 'Body Temperature', 'Measure of the body''s ability to generate and get rid of heat', 'health-and-physiology', 'celsius', '🌡️'),
('respiratory-rate', 'Respiratory Rate', 'Number of breaths taken per minute', 'health-and-physiology', 'per-minute', '🫁'),
('oxygen-saturation', 'Oxygen Saturation', 'Percentage of oxygen-saturated hemoglobin relative to total hemoglobin in the blood', 'health-and-physiology', 'percent', '🩸');

-- Insert global variables for treatments and interventions
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('metformin', 'Metformin', 'First-line medication for the treatment of type 2 diabetes.', 'intake-and-interventions', 'milligram', '💊'),
('lisinopril', 'Lisinopril', 'Medication to treat high blood pressure and heart failure.', 'intake-and-interventions', 'milligram', '💊'),
('adalimumab', 'Adalimumab', 'Biologic medication used to treat rheumatoid arthritis and other inflammatory conditions.', 'intake-and-interventions', 'milligram', '💊'),
('escitalopram', 'Escitalopram', 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression and anxiety disorders.', 'intake-and-interventions', 'milligram', '💊'),
('albuterol', 'Albuterol', 'Medication that opens up the bronchial tubes (air passages) in the lungs when they are spasming.', 'intake-and-interventions', 'microgram', '💊'),
('semaglutide', 'Semaglutide', 'GLP-1 receptor agonist used for the treatment of type 2 diabetes and weight management.', 'intake-and-interventions', 'milligram', '💊'),
('ketamine', 'Ketamine', 'NMDA receptor antagonist with rapid antidepressant effects for treatment-resistant depression.', 'intake-and-interventions', 'milligram', '💊'),
('tocilizumab', 'Tocilizumab', 'Monoclonal antibody against the interleukin-6 receptor (IL-6R) used to treat rheumatoid arthritis.', 'intake-and-interventions', 'milligram', '💊'),
('aspirin', 'Aspirin', 'Common pain reliever and anti-inflammatory medication.', 'intake-and-interventions', 'milligram', '💊'),
('ibuprofen', 'Ibuprofen', 'Nonsteroidal anti-inflammatory drug used for pain relief and reducing inflammation.', 'intake-and-interventions', 'milligram', '💊'),
('sitagliptin', 'Sitagliptin', 'DPP-4 inhibitor used for improving glycemic control in type 2 diabetes.', 'intake-and-interventions', 'milligram', '💊'),
('venlafaxine', 'Venlafaxine', 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression and anxiety disorders.', 'intake-and-interventions', 'milligram', '💊');

-- Insert global variables for anthropometric measurements
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('weight', 'Weight', 'Body weight', 'health-and-physiology', 'kilogram', '⚖️'),
('height', 'Height', 'Body height', 'health-and-physiology', 'meter', '📏'),
('bmi', 'Body Mass Index', 'Body Mass Index calculated from weight and height', 'health-and-physiology', 'kilograms-per-square-meter', '📊');

-- Insert global variables for Atorvastatin Example
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('atorvastatin-20mg', 'Atorvastatin 20mg', 'Specific dosage of Atorvastatin, a lipid-lowering agent.', 'intake-and-interventions', 'milligram', '💊'),
('ldl-cholesterol', 'LDL Cholesterol', 'Low-density lipoprotein cholesterol.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
('total-cholesterol', 'Total Cholesterol', 'Total amount of cholesterol in the blood.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
('cv-event-risk', 'Cardiovascular Event Risk', 'Calculated risk of cardiovascular events.', 'health-and-physiology', 'percent', '❤️'),
('hdl-cholesterol', 'HDL Cholesterol', 'High-density lipoprotein cholesterol.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
('triglycerides', 'Triglycerides', 'Type of fat found in blood.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
('muscle-pain', 'Muscle Pain', 'Aches and pains in the muscles.', 'health-and-physiology', 'zero-to-ten-scale', '😩'),
('liver-enzyme-elevation', 'Liver Enzyme Elevation', 'Increased levels of liver enzymes in the blood.', 'health-and-physiology', 'percent', '🧪');

-- Insert global variables for Klotho Therapy Example
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('klotho-therapy', 'Klotho-Increasing Gene Therapy', 'Experimental gene therapy aimed at increasing Klotho protein levels.', 'intake-and-interventions', 'dimensionless-unit', '🧬'),
('adas-cog', 'Cognitive Function (ADAS-Cog)', 'Alzheimer''s Disease Assessment Scale-Cognitive subscale score.', 'cognitive-performance', 'dimensionless-unit', '🧠'),
('memory-recall', 'Memory Recall', 'Ability to remember information.', 'cognitive-performance', 'percent', '🧠'),
('executive-function', 'Executive Function', 'Higher-level cognitive skills (planning, working memory, etc.).', 'cognitive-performance', 'percent', '🧠'),
('hippocampal-volume', 'Hippocampal Volume', 'Volume of the hippocampus measured by imaging.', 'health-and-physiology', 'milliliter', ' M'), -- Assuming cubic cm or ml
('immune-response', 'Immune Response', 'Reaction of the immune system, often measured by specific markers or events.', 'health-and-physiology', 'zero-to-ten-scale', '🛡️');
-- Note: 'headache' and 'fatigue' already exist

-- Blood markers, peptides and energy for the program templates
-- (also in migration 20261011020000 for existing databases)
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('hba1c', 'HbA1c', 'Hemoglobin A1c: the average blood sugar over about three months.', 'health-and-physiology', 'percent', '🩸'),
('alanine-aminotransferase', 'ALT', 'Alanine aminotransferase, a liver enzyme measured in blood.', 'health-and-physiology', 'units-per-liter', '🩸'),
('apolipoprotein-b', 'ApoB', 'Apolipoprotein B: the number of cholesterol-carrying particles that can block arteries.', 'health-and-physiology', 'milligrams-per-deciliter', '🩸'),
('ferritin', 'Ferritin', 'Ferritin, a measure of the iron stored in the body.', 'health-and-physiology', 'nanograms-per-milliliter', '🩸'),
('c-reactive-protein', 'hs-CRP', 'High-sensitivity C-reactive protein, a marker of inflammation.', 'health-and-physiology', 'milligrams-per-liter', '🩸'),
('energy-level', 'Energy', 'Self-rated energy level.', 'mental-and-emotional-state', 'zero-to-ten-scale', '⚡'),
('tirzepatide', 'Tirzepatide', 'GIP and GLP-1 receptor agonist used for type 2 diabetes and weight management.', 'intake-and-interventions', 'milligram', '💊'),
('bpc-157', 'BPC-157', 'Body Protection Compound-157, a synthetic peptide.', 'intake-and-interventions', 'microgram', '💉'),
('tb-500', 'TB-500', 'A synthetic peptide from thymosin beta-4.', 'intake-and-interventions', 'milligram', '💉');
