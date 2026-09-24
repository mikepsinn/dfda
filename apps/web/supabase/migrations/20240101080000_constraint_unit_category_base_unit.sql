-- Add foreign key constraint for base_unit_id in unit_categories
ALTER TABLE unit_categories
ADD CONSTRAINT fk_unit_categories_base_unit
FOREIGN KEY (base_unit_id) REFERENCES units(id)
ON DELETE RESTRICT;
