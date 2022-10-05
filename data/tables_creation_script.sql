-- below section of code is used to create table 'objects' in database
CREATE TABLE objects (
   obj_id bigint DEFAULT NULL,
   obj_title text,
   obj_beginyear double DEFAULT NULL,
   obj_endyear double DEFAULT NULL,
   obj_medium text,
   obj_dimensions text,
   obj_inscription text,
   obj_attribution text,
   obj_class text,
   loc_site text,
   loc_room text,
   loc_description text,
   img_url text,
   img_thumburl text,
   price double DEFAULT NULL
 );
 