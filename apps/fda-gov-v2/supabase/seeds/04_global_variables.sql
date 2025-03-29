-- Global variables seed file
-- Contains seed data for global variables like side effects, etc.

-- Insert global variables for symptoms, conditions, and side effects
INSERT INTO global_variables (id, name, description, variable_category_id, default_unit_id, emoji)
VALUES
('nausea', 'Nausea', 'Feeling of sickness with an inclination to vomit', 'health-and-physiology', NULL, '🤢'),
('headache', 'Headache', 'Pain in the head or upper neck', 'health-and-physiology', NULL, '🤕'),
('dizziness', 'Dizziness', 'Lightheadedness, feeling faint or unsteady', 'health-and-physiology', NULL, '🌀'),
('fatigue', 'Fatigue', 'Extreme tiredness resulting from mental or physical exertion', 'health-and-physiology', NULL, '😴'),
('stomach-upset', 'Stomach Upset', 'Discomfort or pain in the stomach', 'health-and-physiology', NULL, '🤯'),
('dry-cough', 'Dry Cough', 'Cough that doesn''t produce phlegm or mucus', 'health-and-physiology', NULL, '🤧'),
('rash', 'Rash', 'Area of irritated or swollen skin', 'health-and-physiology', NULL, '🤕'),
('insomnia', 'Insomnia', 'Difficulty falling or staying asleep', 'health-and-physiology', NULL, '😳'),
('type-2-diabetes', 'Type 2 Diabetes', 'A chronic condition that affects the way the body processes blood sugar (glucose).', 'health-and-physiology', NULL, '🍭'),
('hypertension', 'Hypertension', 'High blood pressure is a common condition in which the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems.', 'health-and-physiology', NULL, '💊'),
('rheumatoid-arthritis', 'Rheumatoid Arthritis', 'An autoimmune and inflammatory disease, which means that your immune system attacks healthy cells in your body by mistake, causing inflammation in the affected parts of the body.', 'health-and-physiology', NULL, '🤕'),
('major-depressive-disorder', 'Major Depressive Disorder', 'A mental health disorder characterized by persistently depressed mood or loss of interest in activities, causing significant impairment in daily life.', 'mental-and-emotional-state', NULL, '😔'),
('asthma', 'Asthma', 'A condition in which your airways narrow and swell and may produce extra mucus, making breathing difficult and triggering coughing, wheezing and shortness of breath.', 'health-and-physiology', NULL, '🤧'),
('pain', 'Pain', 'Physical discomfort caused by illness or injury, which can be acute or chronic.', 'health-and-physiology', NULL, '😩');

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
