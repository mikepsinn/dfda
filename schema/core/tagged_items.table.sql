-- Table: core.tagged_items

CREATE TABLE core.tagged_items (
    tag_id UUID NOT NULL REFERENCES core.tags(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    tagged_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (tag_id, item_type, item_id)
);
