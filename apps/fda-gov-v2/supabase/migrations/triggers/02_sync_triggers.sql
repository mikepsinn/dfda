-- Create triggers for syncing conditions and treatments
CREATE TRIGGER sync_condition_trigger
  BEFORE INSERT OR UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION sync_condition_to_global_variable();

CREATE TRIGGER sync_treatment_trigger
  BEFORE INSERT OR UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION sync_treatment_to_global_variable(); 