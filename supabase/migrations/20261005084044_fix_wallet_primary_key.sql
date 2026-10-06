/*
# Fix wallet primary key

The previous migration dropped the old PK but never added a new one.
Duplicate id=1 rows have been cleaned up. Now add the PK properly.
*/
ALTER TABLE wallet ADD CONSTRAINT wallet_pkey PRIMARY KEY (id);
