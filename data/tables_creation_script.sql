-- below section of code is used to create table 'objects' in database
CREATE TABLE objects (
   obj_id bigint auto_increment primary key,
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
   price double DEFAULT NULL
 );

-- below section of code is used to create table 'visitors' in database
CREATE TABLE visitors (
	vis_id bigint auto_increment primary key,
    first_name text,
    last_name text,
    phone_no text,
    email text
);

-- below section of code is used to create table 'members' in database
create table members (
	mem_id bigint auto_increment primary key,
    first_name text,
    last_name text,
    phone_no text,
    email text,
    address1 text,
    address2 text,
    city text,
    state text,
    zipcode text,
    creation_date date default(current_date),
    renewed_date date default(current_date),
    is_active varchar(2) default 'Y'
);

-- below section of code is used to create table 'employees' in database
create table employees (
	emp_id bigint auto_increment primary key,
    first_name text,
    last_name text,
    phone_no text,
    email_id text,
    address1 text,
    address2 text,
    city text,
    state text,
    zipcode text,
    hire_date date default(current_date),
    last_date date default null,
    role varchar(50) default 'worker',
    is_active varchar(2) default 'Y'
);

-- below section of code is used to create table 'events' in database
create table events (
	ev_id bigint auto_increment primary key,
    ev_name text,
    ev_description text,
    ev_date date,
    ev_type text,
    ev_site text,
    ev_room_no text
);

-- below section of code is used to create table 'event_employee_map' in database
create table event_employee_map (
	ev_id bigint,
    emp_id bigint
);

-- below section of code is used to create table 'donations' in database
create table donations(
	don_id bigint auto_increment primary key,
    user_id bigint,
    user_type varchar(2),
    donated_on date default(current_date),
    amount double
);

-- below section of code is used to create table 'ticket_transactions' in database
create table ticket_transactions (
	tick_id bigint auto_increment primary key,
    tick_class text,
    ev_id bigint default null,
    purchase_date date default(current_date),
    child_count int default 0,
    adult_count int default 0,
    senior_count int default 0,
    child_price double,
    adult_price double,
    senior_price double,
    total_amount double,
    user_id bigint,
    user_type varchar(2)
);

-- below section of code is used to create table 'shop_transactions' in database
create table shop_transactions (
	shop_id bigint auto_increment primary key,
    obj_oid bigint,
	total_amount double,
    user_id bigint,
    user_type varchar(2),
    purchase_date date default(current_date)
);

-- below section of code is used to create table 'master_transactions' in database
create table master_transactions (
	tran_id bigint auto_increment primary key,
    tran_type text,
    child_tran_id bigint,
    user_id bigint,
    user_type varchar(2),
    purchase_date date,
    amount double
);

-- below section of code is used to create table 'sold_objects' in database
create table sold_objects (
   obj_id bigint DEFAULT NULL,
   obj_title text,
   obj_beginyear double DEFAULT NULL,
   obj_endyear double DEFAULT NULL,
   obj_medium text,
   obj_dimensions text,
   obj_inscription text,
   obj_attribution text,
   obj_class text,
   img_url text,
   shop_id bigint
);

-- below section of code is used to create table 'contact_us' in database
create table contact_us(
	con_id bigint auto_increment primary key,
    name text,
    email text,
    subject text,
    description text
);

-- below section of code is used to create table 'login' in database
create table login(
	log_id bigint auto_increment primary key,
    user_id bigint,
    user_type varchar(2),
    username text,
    password text
);

-- below section of code is used to create table 'renewal_email_list' in database
create table renewal_email_list(
	email_id bigint auto_increment primary key,
    address text,
    sent varchar(2) default 'N'
);

-- altering objects table to add auto increment to obj_id and primary key
ALTER TABLE objects MODIFY obj_id bigint AUTO_INCREMENT PRIMARY KEY;

-- altering sold_objects table to add auto increment to obj_id and primary key
ALTER TABLE sold_objects MODIFY obj_id bigint AUTO_INCREMENT PRIMARY KEY;

-- create trigger to insert data into master_transactions table when data is inserted into ticket_transactions table
DELIMITER $$
CREATE TRIGGER ticket_transactions_trigger AFTER INSERT ON ticket_transactions FOR EACH ROW
BEGIN
    INSERT INTO master_transactions(tran_type, child_tran_id, user_id, user_type, purchase_date, amount) VALUES('ticket', NEW.tick_id, NEW.user_id, NEW.user_type, NEW.purchase_date, NEW.total_amount);
END$$
DELIMITER ;

-- create trigger to insert data into master_transactions table when data is inserted into shop_transactions table
DELIMITER $$
CREATE TRIGGER shop_transactions_trigger AFTER INSERT ON shop_transactions FOR EACH ROW
BEGIN
    INSERT INTO master_transactions(tran_type, child_tran_id, user_id, user_type, purchase_date, amount) VALUES('shop', NEW.shop_id, NEW.user_id, NEW.user_type, NEW.purchase_date, NEW.total_amount);
END$$
DELIMITER ;

-- create trigger to insert data into master_transactions table when data is inserted into donations table
DELIMITER $$
CREATE TRIGGER donations_trigger AFTER INSERT ON donations FOR EACH ROW
BEGIN
    INSERT INTO master_transactions(tran_type, child_tran_id, user_id, user_type, purchase_date, amount) VALUES('donation', NEW.don_id, NEW.user_id, NEW.user_type, NEW.donated_on, NEW.amount);
END$$
DELIMITER ;

-- create trigger to insert data into sold_objects table when data is deleted from objects table
DELIMITER $$
CREATE TRIGGER objects_trigger AFTER DELETE ON objects FOR EACH ROW
BEGIN
	declare v_shop_id bigint;
    select shop_id into v_shop_id from shop_transactions where obj_id = OLD.obj_id;
    INSERT INTO sold_objects(obj_id, obj_title, obj_beginyear, obj_endyear, obj_medium, obj_dimensions, obj_inscription, obj_attribution, obj_class, img_url, shop_id) VALUES(OLD.obj_id, OLD.obj_title, OLD.obj_beginyear, OLD.obj_endyear, OLD.obj_medium, OLD.obj_dimensions, OLD.obj_inscription, OLD.obj_attribution, OLD.obj_class, OLD.img_url, v_shop_id);
END$$
DELIMITER ;

-- create trigger to delete data from event_employee_map table before data is deleted from event table
DELIMITER $$
CREATE TRIGGER event_employee_map_trigger BEFORE DELETE ON events FOR EACH ROW
BEGIN
    DELETE FROM event_employee_map WHERE ev_id = OLD.ev_id;
END$$
DELIMITER ;

-- creating scheduled event to cancel any membership that is expired
DELIMITER $$
create event membership_cancellation
	on schedule
	every 1 day
	starts '2022-11-06 00:00:00' on completion preserve enable
	do
begin 
	update members set is_active = 'N' where renewed_date+interval 1 year<curdate();
end$$
DELIMITER ;

-- dropping child_price coulmn from ticket_transactions table
alter table ticket_transactions
drop column child_price;

-- adding new columns to ticket_transactions table
alter table ticket_transactions
add student_count int default 0,
add other_count int default 0,
add student_price double,
add other_price double,
add event_date date;

-- adding event price columng to events table
alter table events
add ev_price double;
