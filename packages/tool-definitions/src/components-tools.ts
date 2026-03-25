export const componentsTools = [
  {
    name: "figma_get_library_components",
    description: "Return available team library components, optionally filtered by query."
  },
  {
    name: "figma_create_component",
    description: "Create a component definition."
  },
  {
    name: "figma_search_components",
    description: "Search component inventory by query."
  },
  {
    name: "figma_get_component_details",
    description: "Return detailed information for a single component by key, id, or exact name."
  },
  {
    name: "figma_get_component",
    description: "Return component metadata plus variable bindings for a single component by key, id, or exact name."
  },
  {
    name: "figma_get_component_property_catalog",
    description: "Return a normalized catalog of component property names for easier authoring and instance updates."
  },
  {
    name: "figma_get_component_family_health",
    description: "Score a component family for naming, property consistency, and variant health."
  },
  {
    name: "figma_get_component_image",
    description: "Return a rendered screenshot payload for a single component by key, id, or exact name."
  },
  {
    name: "figma_add_component_property",
    description: "Add a component property to a component or component set."
  },
  {
    name: "figma_edit_component_property",
    description: "Edit a component property on a component or component set."
  },
  {
    name: "figma_delete_component_property",
    description: "Delete a component property from a component or component set."
  },
  {
    name: "figma_arrange_component_set",
    description: "Arrange variants inside a component set into a clean grid layout."
  },
  {
    name: "figma_instantiate_component",
    description: "Instantiate a component into the document."
  },
  {
    name: "figma_batch_instantiate_components",
    description: "Instantiate many components into the document in one request."
  },
  {
    name: "figma_set_instance_properties",
    description: "Update properties on a component instance."
  },
  {
    name: "figma_batch_set_instance_properties",
    description: "Update properties on many component instances in one request."
  }
] as const;
