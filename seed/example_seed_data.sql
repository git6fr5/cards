INSERT INTO example_item (id, name, description, is_archived) VALUES
  (1, 'First item',  'A short description of the first item.',  false),
  (2, 'Second item', 'A short description of the second item.', false),
  (3, 'Third item',  NULL,                                      false);

SELECT setval('example_item_id_seq', (SELECT MAX(id) FROM example_item));
