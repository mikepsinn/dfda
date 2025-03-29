-- Global variables seed file
-- Contains seed data for global variables like side effects, etc.

-- Insert global variables for side effects
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id)
VALUES
('nausea', 'Nausea', 'Feeling of sickness with an inclination to vomit', 
 'side-effect', NULL),
('headache', 'Headache', 'Pain in the head or upper neck', 
 'side-effect', NULL),
('dizziness', 'Dizziness', 'Lightheadedness, feeling faint or unsteady', 
 'side-effect', NULL),
('fatigue', 'Fatigue', 'Extreme tiredness resulting from mental or physical exertion', 
 'side-effect', NULL),
('stomach-upset', 'Stomach Upset', 'Discomfort or pain in the stomach', 
 'side-effect', NULL),
('dry-cough', 'Dry Cough', 'Cough that doesn''t produce phlegm or mucus', 
 'side-effect', NULL),
('rash', 'Rash', 'Area of irritated or swollen skin', 
 'side-effect', NULL),
('insomnia', 'Insomnia', 'Difficulty falling or staying asleep', 
 'side-effect', NULL);

-- Insert global variables for vital signs
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id)
VALUES
('blood-pressure', 'Blood Pressure', 'Pressure of circulating blood against the walls of blood vessels', 
 'vital-sign', 'mmhg'),
('heart-rate', 'Heart Rate', 'Number of times your heart beats per minute', 
 'vital-sign', 'bpm'),
('blood-glucose', 'Blood Glucose', 'Concentration of glucose in the blood', 
 'vital-sign', 'mg-dl'),
('body-temperature', 'Body Temperature', 'Measure of the body''s ability to generate and get rid of heat', 
 'vital-sign', 'celsius'),
('respiratory-rate', 'Respiratory Rate', 'Number of breaths taken per minute', 
 'vital-sign', 'breaths-min'),
('oxygen-saturation', 'Oxygen Saturation', 'Percentage of oxygen-saturated hemoglobin relative to total hemoglobin in the blood', 
 'vital-sign', 'percent');

-- Insert global variables for conditions
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id)
VALUES
('type-2-diabetes', 'Type 2 Diabetes', 'A chronic condition that affects the way the body processes blood sugar (glucose).', 
 'condition', NULL),
('hypertension', 'Hypertension', 'High blood pressure is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems.', 
 'condition', NULL),
('rheumatoid-arthritis', 'Rheumatoid Arthritis', 'An autoimmune and inflammatory disease, which means that your immune system attacks healthy cells in your body by mistake, causing inflammation in the affected parts of the body.', 
 'condition', NULL),
('major-depressive-disorder', 'Major Depressive Disorder', 'A mental health disorder characterized by persistently depressed mood or loss of interest in activities, causing significant impairment in daily life.', 
 'condition', NULL),
('asthma', 'Asthma', 'A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult and triggering coughing, wheezing and shortness of breath.', 
 'condition', NULL),
('headache', 'Headache', 'Pain in the head or upper neck, which can be a symptom of various conditions or a condition itself.', 
 'condition', NULL),
('pain', 'Pain', 'Physical discomfort caused by illness or injury, which can be acute or chronic.', 
 'condition', NULL);

-- Insert global variables for treatments
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id)
VALUES
('metformin', 'Metformin', 'First-line medication for the treatment of type 2 diabetes.', 
 'treatment', NULL),
('lisinopril', 'Lisinopril', 'Medication to treat high blood pressure and heart failure.', 
 'treatment', NULL),
('adalimumab', 'Adalimumab', 'Biologic medication used to treat rheumatoid arthritis and other inflammatory conditions.', 
 'treatment', NULL),
('escitalopram', 'Escitalopram', 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression and anxiety disorders.', 
 'treatment', NULL),
('albuterol', 'Albuterol', 'Medication that opens up the bronchial tubes (air passages) in the lungs when they are spasming.', 
 'treatment', NULL),
('semaglutide', 'Semaglutide', 'GLP-1 receptor agonist used for the treatment of type 2 diabetes and weight management.', 
 'treatment', NULL),
('ketamine', 'Ketamine', 'NMDA receptor antagonist with rapid antidepressant effects for treatment-resistant depression.', 
 'treatment', NULL),
('tocilizumab', 'Tocilizumab', 'Monoclonal antibody against the interleukin-6 receptor (IL-6R) used to treat rheumatoid arthritis.', 
 'treatment', NULL),
('aspirin', 'Aspirin', 'Common pain reliever and anti-inflammatory medication.', 
 'treatment', NULL),
('ibuprofen', 'Ibuprofen', 'Nonsteroidal anti-inflammatory drug used for pain relief and reducing inflammation.', 
 'treatment', NULL),
('sitagliptin', 'Sitagliptin', 'DPP-4 inhibitor used for improving glycemic control in type 2 diabetes.', 
 'treatment', NULL),
('venlafaxine', 'Venlafaxine', 'Serotonin-norepinephrine reuptake inhibitor (SNRI) used to treat depression and anxiety disorders.', 
 'treatment', NULL);
