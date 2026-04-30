# Equipment Analysis

Carefully examine this image and identify kitchen equipment, cookware, appliances, and food ingredients you can see.

If the image is only or mostly text with no visible physical pantry products, food, cookware, appliances, or tools, reject it as inventory evidence. This includes screenshots, documents, grocery lists, recipes, receipts, menus, notes, chat messages, and typed inventories. Do not turn those words into ingredients or equipment. Return empty "ingredients" and "equipment" arrays with "rejected": true, "rejectionCode": "TEXT_ONLY_DOCUMENT", and a short "rejectionMessage".

Do not reject photos of real physical products or kitchen tools just because their packaging, labels, buttons, or brand marks are readable. In those cases, use the text only to name the visible physical object.

Only include equipment you are confident is used for cooking, food preparation, food storage, or food serving.

Prioritize equipment that materially affects cooking capability: appliances, cookware, knives, utensils, cutting boards, mixing bowls, prep vessels, bakeware, strainers, and food-storage containers.

Judge each object by its function, not by whether the room looks like a kitchen. A minimal, mixed-use, or unusual room can still contain real kitchen equipment, so include true kitchen tools and appliances wherever they appear.

Do not infer that an object is kitchen equipment just because it is near a counter, sink, island, dining table, or stove.

Do not list bathroom items, luggage, coats, shoes, pet items, decor, furniture, televisions, lamps, dining tables, dining chairs, shelving units, carts, sinks, faucets, towel bars, range hoods, vent hoods, countertops, cabinets, islands, cleaning supplies, paper towel holders, tissue boxes, drinkware, or unrelated household objects as kitchen equipment. Treat those as room context or kitchen infrastructure, not usable cooking equipment.

Installed plumbing fixtures are never kitchen equipment. Exclude sinks, faucets, sprayers, drains, garbage disposals, and soap pumps even when they are part of a kitchen work area.

Exclude wine bottles, wine glasses, water filtration dispensers, and water filtration systems from kitchen equipment.

Dedicated beverage-prep tools such as coffee makers, espresso machines, French presses, kettles, and coffee or tea carafes can count when they are clearly used for preparing or serving drinks.

If knives, spoons, spatulas, or other cooking tools are stored inside a holder or block, list the tools when clearly visible, not the storage object. Do not list knife blocks, generic utensil sets, utensil crocks, wire baskets, or paper towel holders as equipment.

Serving and storage items such as mason jars or serving trays can count when they are clearly used for food storage or serving.

Ignore humans and animals.

Do not use speculative labels like "carafe or water bottle." If you cannot tell whether an object is a true kitchen prep or serving vessel, omit it.

For pots and pans, estimate their sizes based on visual cues like relative proportions, handles, and comparison to other items. Be thorough and specific about sizes, colors, and types of items.
