function onClickModal(element) {
    document.getElementById("img_demo").src = element.src;
    document.getElementById("modal_demo").style.display = "block";
}

async function submitQuery(){
    var name = document.getElementById("query_name").value;
    var email = document.getElementById("query_email").value;
    var subject = document.getElementById("query_subject").value;
    var desc = document.getElementById("query_desc").value;
    var data = [{
        name: name,
        email: email,
        subject: subject,
        description: desc
    }];
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    };
    var url = "http://localhost:3000/contactus/";
    try{
        const res = await fetch(url, config);
        if (res.status === 200) {
            var data = [{email_list: email,email_type:"contact_us_reply"}];
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data)
            };
            var url = "http://localhost:3000/sendEmails/";
            var email_resp = await fetch(url, config);
            alert("Query Submitted Successfully");
            document.getElementById("query_name").value = "";
            document.getElementById("query_email").value = "";
            document.getElementById("query_subject").value = "";
            document.getElementById("query_desc").value = "";
        }
    } catch (err) {
        alert("Error in submitting query");
    }
}

async function eventDetails(){
    // get event id from url
    var entries = window.location.search.substring(1).split("&");
    var event_id = entries[0].split("=")[1];
    var show_purchase = entries[1].split("=")[1];
    var element = document.getElementById("purchase_ticket");
    if (element != null) {
        if (show_purchase == "true"){
            document.getElementById("purchase_ticket").style.visibility = "visible";
        } else {
            document.getElementById("purchase_ticket").style.visibility = "hidden";
        }
    }
    var url = "http://localhost:3000/eventdetails/" + event_id;
    try{
        const res = await fetch(url);
        const data = await res.json();
        document.getElementById("ev_name").innerHTML = data.ev_name;
        document.getElementById("ev_desc").innerHTML = data.ev_description;
        var date = data.ev_date.split("T");
        document.getElementById("ev_date_1").innerText = date[0];
        document.getElementById("ev_date_2").innerText = date[0];
        var location = "Room No. " + data.ev_room_no + ", in " + data.ev_site;
        document.getElementById("ev_loc").innerText = location;
        document.getElementById("event_id").innerHTML = event_id;
        document.getElementById("event_price").innerHTML = data.ev_price;
    } catch (err) {
        alert("Error in fetching event details");
    }
}

async function fillTicketDetails() {
    let entries = window.location.search;
    if (entries != "") {
        entries = entries.substring(1).split("&");
        let event_id = entries[0].split("=")[1];
        let event_price = entries[1].split("=")[1];
        let event_date = entries[2].split("=")[1];
        let event_type = entries[3].split("=")[1];
        event_price = parseFloat(event_price);
        console.log(event_date);
        
        document.getElementById("adult_price").innerHTML = event_price;
        document.getElementById("adult_subtotal").innerHTML = event_price/2;
        document.getElementById("senior_price").innerHTML = event_price/2;
        document.getElementById("other_price").innerHTML = event_price/2;
        document.getElementById("student_price").innerHTML = (event_price*3)/4;

        document.getElementById("event_id").innerHTML = event_id;
        document.getElementById("event_type").innerHTML = event_type;
        document.getElementById("ev_date").value = event_date;
    }
}

async function setEventList(event_type){
    getCurrentEvents(event_type);
}

async function getCurrentEvents(event_type){
    var url = "";
    var show_purchase = true;
    if(event_type == "shows"){
        url = "http://localhost:3000/currentshows";
    } else if(event_type == "exhibitions"){
        url = "http://localhost:3000/currentexhibitions";
    } else if(event_type == "auctions"){
        url = "http://localhost:3000/currentauctions";
    }
    try{
        const res = await fetch(url);
        const data = await res.json();
        var uptab = document.getElementById("upcoming-tab");
        var pasttab = document.getElementById("past-tab");
        pasttab.classList.remove("active");
        uptab.classList.add("active");
        var html = "";
        html += '<div class="tab-pane show active fade" id="past" role="tabpanel" aria-labelledby="upcoming-tab">'
        html += '<div class="row mx-xl-n4">'
        for(var i=0; i<data.length; i++){
            var date = data[i].ev_date.split("T");
            html+= '<div class="col-12 col-md-6 px-xl-4">';
            html+= '<article class="currExibitColumn mb-6 mb-lg-9 mb-xl-14 mx-auto">';
            html+= '<h2 class="mb-3">'
            html+= '<a href="javascript:setAndCallEventDetail('+'\''+event_type+'\''+','+data[i].ev_id+','+show_purchase+')">'+ data[i].ev_name +'</a>';
            html+= '</h2>';
            html+= '<time datetime="2011-01-12" class="d-block cecTime text-gray777">'+ date[0] +'</time>'
            html+= '</article>';
            html+= '</div>';
        }
        html += '</div>'
        html+= '</div>';
        document.getElementById("tab_content").innerHTML = html;
    } catch (err) {
        alert("Error in fetching current events");
    }
}

async function getPastEvents(event_type){
    var url = "";
    var show_purchase = false;
    if(event_type == "shows"){
        url = "http://localhost:3000/pastshows";
    } else if(event_type == "exhibitions"){
        url = "http://localhost:3000/pastexhibitions";
    } else if(event_type == "auctions"){
        url = "http://localhost:3000/pastauctions";
    }
    try{
        const res = await fetch(url);
        const data = await res.json();
        var uptab = document.getElementById("upcoming-tab");
        var pasttab = document.getElementById("past-tab");
        uptab.classList.remove("active");
        pasttab.classList.add("active");
        var html = "";
        html += '<div class="tab-pane show active fade" id="past" role="tabpanel" aria-labelledby="past-tab">'
        html += '<div class="row mx-xl-n4">'
        for(var i=0; i<data.length; i++){
            var date = data[i].ev_date.split("T");
            html+= '<div class="col-12 col-md-6 px-xl-4">';
            html+= '<article class="currExibitColumn mb-6 mb-lg-9 mb-xl-14 mx-auto">';
            html+= '<h2 class="mb-3">'
            html+= '<a href="javascript:setAndCallEventDetail('+'\''+event_type+'\''+','+data[i].ev_id+','+show_purchase+')">'+ data[i].ev_name +'</a>';
            html+= '</h2>';
            html+= '<time datetime="2011-01-12" class="d-block cecTime text-gray777">'+ date[0] +'</time>'
            html+= '</article>';
            html+= '</div>';
        }
        html += '</div>'
        html+= '</div>';
        document.getElementById("tab_content").innerHTML = html;
    } catch (err) {
        alert("Error in fetching past events");
    }
}

async function setAndCallEventDetail(event_type,ev_id,show_purchase){
    if (event_type == "shows"){
        window.location.assign('./single-show.html?ev_id='+ev_id+'&show_purchase='+show_purchase);
    } else if (event_type == "exhibitions"){
        window.location.assign('./single-exhibition.html?ev_id='+ev_id+'&show_purchase='+show_purchase);
    } else if (event_type == "auctions"){
        window.location.assign('./single-auction.html?ev_id='+ev_id+'&show_purchase='+show_purchase); 
    }
}

async function purchaseEventTickets(event_type){
    var ev_id = document.getElementById("event_id").innerHTML;
    var ev_price = document.getElementById("event_price").innerHTML;
    var ev_date =  document.getElementById("ev_date_1").innerHTML;
    if (event_type == "show"){
        window.location.assign('./buy-tickets.html?ev_id='+ev_id+'&ev_price='+ev_price+'&ev_date='+ev_date+'&ev_type=show');
    } else if (event_type == "exhibition"){
        window.location.assign('./buy-tickets.html?ev_id='+ev_id+'&ev_price='+ev_price+'&ev_date='+ev_date+'&ev_type=exhibition');
    }
}

async function sendRenewalMails(){
    try{
        var url1 = "http://localhost:3000/getRenewalEmails/";
        const res1 = await fetch(url1);
        const data1 = await res1.json();
        // form a list of email addresses
        var emails = "";
        for(var i=0; i<data1.length; i++){
            emails += data1[i].address + ",";
        }
        // remove the last comma
        emails = emails.substring(0, emails.length - 1);
        const data2 = [{"email_type":"renewal","email_list":emails}];
        const config1 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data2)
        };
        var url2 = "http://localhost:3000/sendEmails/";
        // send the email
        var res2 = await fetch(url2, config1);
        if (res2.status != 200){
            alert("Error in sending emails");
        }
        // form a list of email ids
        var data3 = [];
        for(var i=0; i<data1.length; i++){
            data3.push({email_id: data1[i].email_id});
        }
        const config2 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data3)
        };
        var url3 = "http://localhost:3000/updateEmailStatus/";
        var res3 = await fetch(url3, config2);
        if (res3.status != 200){
            alert("Error in updating email status");
        }else{
            alert("Emails sent successfully");
        }
    } catch (err) {
        alert("Error in sending renewal emails");
    }
}

async function getCredentials(){
    var first_name = document.getElementById("first_name").value;
    var last_name = document.getElementById("last_name").value;
    var email = document.getElementById("email").value;
    try{
        const data = {"first_name":first_name,"last_name":last_name,"email":email};
        var url = "http://localhost:3000/getCredentials/?" + (new URLSearchParams(data)).toString();
        // send data to server

        var res1 = await fetch(url);
        var data1 = await res1.json();
        if (res1.status == 200){
            // send the email
            var url2= "http://localhost:3000/sendEmails/";
            var data2 = [{"email_type":"credentials","email_list":email,"username":data1[0].username,"password":data1[0].password}];
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data2)
            };
            var res2 = await fetch(url2, config);
            if (res2.status != 200){
                alert("Error in sending emails");
            }else{
                alert("Credentials sent to email successfully");
                window.location.assign('./my-account.html');
            }
        } else if(res1.status == 300) {
            alert("Credentials not found");
        } else{
            alert("Error in fetching credentials");
        }
    } catch (err) {
        alert("Error in getting credentials");
    }
}

async function donateAmount(){
    var first_name = document.getElementById("first_name").value;
    var last_name = document.getElementById("last_name").value;
    var email = document.getElementById("email").value;
    var phone = document.getElementById("phone").value;
    var total_amount = document.getElementById("total_amount").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (first_name == "" || first_name == null || first_name == undefined){
        alert("First name cannot be empty");
        return;
    }
    if (last_name == "" || last_name == null || last_name == undefined){
        alert("Last name cannot be empty");
        return;
    }
    if (email == "" || email == null || email == undefined){
        alert("Email cannot be empty");
        return;
    }
    if (phone == "" || phone == null || phone == undefined){
        alert("Contact No cannot be empty");
        return;
    }
    if (total_amount == "" || total_amount == null || total_amount == undefined){
        alert("Amount cannot be empty");
        return;
    }

    // convert total_amount to float
    total_amount = parseFloat(total_amount);
    try{
        var url1 = "http://localhost:3000/makeDonation/";
        var data1 = [{"first_name":first_name,"last_name":last_name,"email":email,"phone":phone,"amount":total_amount}];
        const config1 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data1)
        };
        var res1 = await fetch(url1, config1);
        if (res1.status == 200){
            alert("Donation successful");
            var url2 = "http://localhost:3000/sendEmails/";
            var data2 = [{"email_type":"donation","email_list":email}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data2)
            };
            var res2 = await fetch(url2, config2);
            window.location.assign('./donate.html');
        } else{
            alert("Donation Transaction failed");
        }
    } catch (err) {
        alert("Donation Transaction failed");
    }
}

async function purchaseTickets(){
    var first_name = document.getElementById("first_name").value;
    var last_name = document.getElementById("last_name").value;
    var email = document.getElementById("email").value;
    var phone = document.getElementById("phone").value;
    var ev_date = document.getElementById("ev_date").value;
    
    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (first_name == "" || first_name == null || first_name == undefined){
        alert("Please enter first name");
        return;
    }
    if (last_name == "" || last_name == null || last_name == undefined){
        alert("Please enter last name");
        return;
    }
    if (email == "" || email == null || email == undefined){
        alert("Please enter email");
        return;
    }
    if (phone == "" || phone == null || phone == undefined){
        alert("Please enter phone");
        return;
    }
    if (ev_date == "" || ev_date == null || ev_date == undefined){
        alert("Please enter event date");
        return;
    }

    // get the number of tickets
    var adult_count = parseInt(document.getElementById("adult_count").value);
    var child_count = parseInt(document.getElementById("child_count").value);
    var senior_count = parseInt(document.getElementById("senior_count").value);
    var student_count = parseInt(document.getElementById("student_count").value);
    var other_count = parseInt(document.getElementById("other_count").value);

    // get price of tickets
    var adult_price = parseFloat(document.getElementById("adult_price").innerHTML);
    var child_price = parseFloat(document.getElementById("child_price").innerHTML);
    var senior_price = parseFloat(document.getElementById("senior_price").innerHTML);
    var student_price = parseFloat(document.getElementById("student_price").innerHTML);
    var other_price = parseFloat(document.getElementById("other_price").innerHTML);

    // get ticket_total
    var ticket_total = parseFloat(document.getElementById("ticket_total").innerHTML);

    var event_id = document.getElementById("event_id").innerHTML;
    var event_type = document.getElementById("event_type").innerHTML;

    try {
        var url1 = "http://localhost:3000/buyTickets/";
        var data1 = [{"first_name":first_name,"last_name":last_name,"email":email,"phone":phone,"ev_date":ev_date,"adult_count":adult_count,"child_count":child_count,"senior_count":senior_count,"student_count":student_count,"other_count":other_count,"adult_price":adult_price,"child_price":child_price,"senior_price":senior_price,"student_price":student_price,"other_price":other_price,"ticket_total":ticket_total,"event_id":event_id,"event_type":event_type}];
        const config1 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data1)
        };
        var res1 = await fetch(url1, config1);
        if (res1.status == 200){
            alert("Tickets purchased successfully");
            var url2 = "http://localhost:3000/sendEmails/";
            var data2 = [{"email_type":"purchase_ticket","email_list":email}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data2)
            };
            var res2 = await fetch(url2, config2);
            window.location.assign('./buy-tickets.html');
        } else{
            alert("Ticket purchase failed");
        }
    } catch (err) {
        alert("Ticket purchase failed");
    }
}

async function showRegistrationForm(){
    document.getElementById("registerDiv").style.display = "block";
}

async function addEmployeeBlock(){
    let empBlockStyle = document.getElementById("newEmployeeDiv").style.display;
    if (empBlockStyle == "none"){
        document.getElementById("newEmployeeDiv").style.display = "block";
    } else{
        document.getElementById("newEmployeeDiv").style.display = "none";
    }
}

async function addEventBlock(){
    let eventBlockStyle = document.getElementById("newEventDiv").style.display;
    if (eventBlockStyle == "none"){
        document.getElementById("newEventDiv").style.display = "block";
    } else{
        document.getElementById("newEventDiv").style.display = "none";
    }
}

async function addArtBlock(){
    let artBlockStyle = document.getElementById("newArtDiv").style.display;
    if (artBlockStyle == "none"){
        document.getElementById("newArtDiv").style.display = "block";
    } else{
        document.getElementById("newArtDiv").style.display = "none";
    }
}

async function registerNewMember(){
    var first_name = document.getElementById("first_name").value;
    var last_name = document.getElementById("last_name").value;
    var email = document.getElementById("email").value;
    var phone = document.getElementById("phone").value;
    var address1 = document.getElementById("address1").value;
    var address2 = document.getElementById("address2").value;
    var city = document.getElementById("city").value;
    var state = document.getElementById("state").value;
    var zip = document.getElementById("zip").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (first_name == "" || first_name == null || first_name == undefined){
        alert("Please enter first name");
        return;
    }
    if (last_name == "" || last_name == null || last_name == undefined){
        alert("Please enter last name");
        return;
    }
    if (email == "" || email == null || email == undefined){
        alert("Please enter email");
        return;
    }
    if (phone == "" || phone == null || phone == undefined){
        alert("Please enter phone");
        return;
    }
    if (address1 == "" || address1 == null || address1 == undefined){
        alert("Please enter address1");
        return;
    }
    if (city == "" || city == null || city == undefined){
        alert("Please enter city");
        return;
    }
    if (state == "" || state == null || state == undefined){
        alert("Please enter state");
        return;
    }
    if (zip == "" || zip == null || zip == undefined){
        alert("Please enter zip");
        return;
    }

    var username = document.getElementById("username").value;
    var pass = document.getElementById("pass").value;
    var conf_pass = document.getElementById("conf_pass").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (username == "" || username == null || username == undefined){
        alert("Please enter username");
        return;
    }
    if (pass == "" || pass == null || pass == undefined){
        alert("Please enter password");
        return;
    }
    if (conf_pass == "" || conf_pass == null || conf_pass == undefined){
        alert("Please enter confirm password");
        return;
    }

    // validate the password and confirm password fields to be same
    if (pass != conf_pass){
        alert("Password and confirm password fields do not match");
        return;
    }

    try {
        var url1 = "http://localhost:3000/registermember/";
        var data1 = [{"first_name":first_name,"last_name":last_name,"email":email,"phone":phone,"address1":address1,"address2":address2,"city":city,"state":state,"zip":zip,"username":username,"password":pass}];
        const config1 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data1)
        };
        var res1 = await fetch(url1, config1);
        if (res1.status == 200){
            alert("Member registered successfully");
            var url2 = "http://localhost:3000/sendEmails/";
            var data2 = [{"email_type":"register","email_list":email}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data2)
            };
            var res2 = await fetch(url2, config2);
            window.location.assign('./membership.html');
        } else if(res1.status == 300){
            alert("username already exists");
        } else{
            alert("Member registration failed");
        }
    } catch (err) {
        alert("Registration failed");
    }
}

async function addEmployee(){
    var first_name = document.getElementById("emp_first_name").value;
    var last_name = document.getElementById("emp_last_name").value;
    var email = document.getElementById("emp_email").value;
    var phone_no = document.getElementById("emp_phone").value;
    var address1 = document.getElementById("emp_address1").value;
    var address2 = document.getElementById("emp_address2").value;
    var city = document.getElementById("emp_city").value;
    var state = document.getElementById("emp_state").value;
    var zipcode = document.getElementById("emp_zip").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (first_name == "" || first_name == null || first_name == undefined){
        alert("Please enter first name");
        return;
    }
    if (last_name == "" || last_name == null || last_name == undefined){
        alert("Please enter last name");
        return;
    }
    if (email == "" || email == null || email == undefined){
        alert("Please enter email");
        return;
    }
    if (phone_no == "" || phone_no == null || phone_no == undefined){
        alert("Please enter phone");
        return;
    }
    if (address1 == "" || address1 == null || address1 == undefined){
        alert("Please enter address1");
        return;
    }
    if (city == "" || city == null || city == undefined){
        alert("Please enter city");
        return;
    }
    if (state == "" || state == null || state == undefined){
        alert("Please enter state");
        return;
    }
    if (zipcode == "" || zipcode == null || zipcode == undefined){
        alert("Please enter zip");
        return;
    }

    var username = document.getElementById("emp_username").value;
    var pass = document.getElementById("emp_pass").value;
    var conf_pass = document.getElementById("emp_conf_pass").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (username == "" || username == null || username == undefined){
        alert("Please enter username");
        return;
    }
    if (pass == "" || pass == null || pass == undefined){
        alert("Please enter password");
        return;
    }
    if (conf_pass == "" || conf_pass == null || conf_pass == undefined){
        alert("Please enter confirm password");
        return;
    }

    // validate the password and confirm password fields to be same
    if (pass != conf_pass){
        alert("Password and confirm password fields do not match");
        return;
    }

    try {
        var url1 = "http://localhost:3000/createemployee/";
        var data1 = [{"first_name":first_name,"last_name":last_name,"email":email,"phone_no":phone_no,"address1":address1,"address2":address2,"city":city,"state":state,"zipcode":zipcode,"username":username,"password":pass}];
        const config1 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data1)
        };
        var res1 = await fetch(url1, config1);
        if (res1.status == 200){
            alert("Employee enrolled successfully");
            var url2 = "http://localhost:3000/sendEmails/";
            var data2 = [{"email_type":"enrolled","email_list":email,'username':username,'password':pass}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data2)
            };
            var res2 = await fetch(url2, config2);
            // clear the fields
            document.getElementById("emp_first_name").value = "";
            document.getElementById("emp_last_name").value = "";
            document.getElementById("emp_email").value = "";
            document.getElementById("emp_phone").value = "";
            document.getElementById("emp_address1").value = "";
            document.getElementById("emp_address2").value = "";
            document.getElementById("emp_city").value = "";
            document.getElementById("emp_state").value = "";
            document.getElementById("emp_zip").value = "";
            document.getElementById("emp_username").value = "";
            document.getElementById("emp_pass").value = "";
            document.getElementById("emp_conf_pass").value = "";
            // hide the div
            document.getElementById("newEmployeeDiv").style.display = "none";
        } else if(res1.status == 300){
            alert("username already exists");
        } else{
            alert("Employee registration failed");
        }
    } catch (err) {
        alert("Employee Registration failed");
    }
}

// get selected employees from multiselect dropdown ev_employees
function getSelectedEmployees(){
    var selectedEmployees = [];
    var employees = document.getElementById("ev_employees");
    for (var i = 0; i < employees.options.length; i++) {
        if (employees.options[i].selected) {
            selectedEmployees.push(parseInt(employees.options[i].value));
        }
    }
    return selectedEmployees;
}

async function addEvent() {
    let ev_name = document.getElementById("ev_name").value;
    let ev_desc = document.getElementById("ev_desc").value;
    let ev_date = document.getElementById("ev_date").value;
    let ev_type = document.getElementById("ev_type").value;
    let ev_site = document.getElementById("ev_site").value;
    let ev_room = document.getElementById("ev_room").value;
    let ev_price = document.getElementById("ev_price").value;
    let ev_employees = getSelectedEmployees();

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (ev_name == "" || ev_name == null || ev_name == undefined){
        alert("Please enter event name");
        return;
    }
    if (ev_desc == "" || ev_desc == null || ev_desc == undefined){
        alert("Please enter event description");
        return;
    }
    if (ev_date == "" || ev_date == null || ev_date == undefined){
        alert("Please enter event date");
        return;
    }
    if (ev_type == "" || ev_type == null || ev_type == undefined){
        alert("Please enter event type");
        return;
    }
    if (ev_site == "" || ev_site == null || ev_site == undefined){
        alert("Please enter event site");
        return;
    }
    if (ev_room == "" || ev_room == null || ev_room == undefined){
        alert("Please enter event room");
        return;
    }
    if (ev_employees.length==0 || ev_employees == null || ev_employees == undefined){
        alert("Please enter event employees");
        return;
    }
    if (ev_price == 0 || ev_price == null || ev_price == undefined){
        alert("Please enter event price");
        return;
    }

    try {
        var url = "http://localhost:3000/createevent/";
        var data = [{"ev_name":ev_name,"ev_description":ev_desc,"ev_date":ev_date,"ev_type":ev_type,"ev_site":ev_site,"ev_room_no":ev_room,"assigned_employees":ev_employees,"ev_price":ev_price}];
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data)
        };
        var res = await fetch(url, config);
        if (res.status == 200){
            alert("Event created successfully");
            // clear the fields
            document.getElementById("ev_name").value = "";
            document.getElementById("ev_desc").value = "";
            document.getElementById("ev_date").value = "";
            document.getElementById("ev_type").value = "";
            document.getElementById("ev_site").value = "";
            document.getElementById("ev_room").value = "";
            document.getElementById("ev_employees").value = "";
            // hide the div
            document.getElementById("newEventDiv").style.display = "none";
        } else{
            alert("Event creation failed");
        }
    } catch (err) {
        alert("Event Creation failed");
    }

}

async function addArt() {
    let art_title = document.getElementById("art_title").value;
    let art_beg = document.getElementById("art_beg").value;
    let art_end = document.getElementById("art_end").value;
    let art_medium = document.getElementById("art_medium").value;
    let art_dim = document.getElementById("art_dim").value;
    let art_ins = document.getElementById("art_ins").value;
    let art_artist = document.getElementById("art_artist").value;
    let art_type = document.getElementById("art_type").value;
    let art_site = document.getElementById("art_site").value;
    let art_room = document.getElementById("art_room").value;
    let art_loc_desc = document.getElementById("art_loc_desc").value;
    let art_price = document.getElementById("art_price").value;

    // validate the fields to be non-empty, null or undefined and send alert if empty
    if (art_title == "" || art_title == null || art_title == undefined){
        alert("Please enter artwork title");
        return;
    }
    if (art_beg == 0 || art_beg == null || art_beg == undefined){
        alert("Please enter artwork beginning year");
        return;
    }
    if (art_end == 0 || art_end == null || art_end == undefined){
        alert("Please enter artwork ending year");
        return;
    }
    if (art_medium == "" || art_medium == null || art_medium == undefined){
        alert("Please enter artwork medium");
        return;
    }
    if (art_dim == "" || art_dim == null || art_dim == undefined){
        alert("Please enter artwork dimensions");
        return;
    }
    if (art_ins == "" || art_ins == null || art_ins == undefined){
        alert("Please enter artwork inscription");
        return;
    }
    if (art_artist == "" || art_artist == null || art_artist == undefined){
        alert("Please enter artwork artist");
        return;
    }
    if (art_type == "" || art_type == null || art_type == undefined){
        alert("Please enter artwork type");
        return;
    }
    if (art_site == "" || art_site == null || art_site == undefined){
        alert("Please enter artwork site");
        return;
    }
    if (art_room == "" || art_room == null || art_room == undefined){
        alert("Please enter artwork room");
        return;
    }
    if (art_loc_desc == "" || art_loc_desc == null || art_loc_desc == undefined){
        alert("Please enter artwork location description");
        return;
    }
    if (art_price == 0 || art_price == null || art_price == undefined){
        alert("Please enter artwork price");
        return;
    }
    let img_src = document.querySelector("#img_src").files[0];
    if (img_src == "" || img_src == null || img_src == undefined){
        alert("Please select artwork image");
        return;
    }

    // post request with image file as multipart/form-data

    try{
        let url1 = "http://localhost:3000/art_upload/";
        let data1 = new FormData();
        data1.append("art_image", img_src);
        let config1 = {
            headers: {
                'enctype': 'multipart/form-data',
                Accept: 'application/json'
            },
            method: 'POST',
            body: data1
        };
        let res1 = await fetch(url1, config1);
        let img_data = await res1.json();
        let img_url = "";
        if (res1.status == 200){
            img_url = img_data["destination"].substring(6);
            img_url+= img_data["originalname"];
        } else{
            alert("Issue with image. Please try with another image");
            return;
        }

        // post request with artwork details
        let url2 = "http://localhost:3000/add_art/";
        let data2 = [{"art_title":art_title,"art_beg":art_beg,"art_end":art_end,"art_medium":art_medium,"art_dim":art_dim,"art_ins":art_ins,"art_artist":art_artist,"art_type":art_type,"art_site":art_site,"art_room":art_room,"art_loc_desc":art_loc_desc,"art_price":art_price,"art_image":img_url}];
        const config2 = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(data2)
        };
        var res2 = await fetch(url2, config2);
        if (res2.status == 200){
            alert("Artwork added successfully");
            // clear the fields
            document.getElementById("art_title").value = "";
            document.getElementById("art_beg").value = "";
            document.getElementById("art_end").value = "";
            document.getElementById("art_medium").value = "";
            document.getElementById("art_dim").value = "";
            document.getElementById("art_ins").value = "";
            document.getElementById("art_artist").value = "";
            document.getElementById("art_type").value = "";
            document.getElementById("art_site").value = "";
            document.getElementById("art_room").value = "";
            document.getElementById("art_loc_desc").value = "";
            document.getElementById("art_price").value = "";
            document.getElementById("img_src").value = "";
            // hide the div
            document.getElementById("newArtDiv").style.display = "none";
        } else{
            alert("Artwork addition failed");
        }
    } catch (err) {
        alert("Artwork addition failed");
    }
}

async function getMemberPortalDetails() {
    var member_id = 27;
    // getting personal details
    try {
        let url1 = "http://localhost:3000/getmemberdetails/" + member_id;
        let res1 = await fetch(url1);
        let data1 = await res1.json();
        document.getElementById("first_name").value = data1.personal.first_name;
        document.getElementById("last_name").value = data1.personal.last_name;
        document.getElementById("email").value = data1.personal.email;
        document.getElementById("phone").value = data1.personal.phone_no;
        document.getElementById("address1").value = data1.personal.address1;
        document.getElementById("address2").value = data1.personal.address2;
        document.getElementById("city").value = data1.personal.city;
        document.getElementById("state").value = data1.personal.state;
        document.getElementById("zip").value = data1.personal.zipcode;
        document.getElementById("username").value = data1.login.username;
        document.getElementById("pass").value = data1.login.password;
        let renew_date = data1.personal.renewed_date;
        renew_date = renew_date.split("T")[0];
        document.getElementById("renew_date").value = renew_date;
        document.getElementById("member_id").innerText = data1.personal.mem_id;

        // get total donations
        let url2 = "http://localhost:3000/getDonations/" + member_id;
        let res2 = await fetch(url2);
        let data2 = await res2.json();
        document.getElementById("donations").value = data2.total_donations.total_donations;

        // get upcoming events
        let url3 = "http://localhost:3000/getupcomingevents/" + member_id;
        let res3 = await fetch(url3);
        let data3 = await res3.json();
        let table1 = document.getElementById("event_tables");
        for (let i = 0; i < data3.length; i++) {
            let row = table1.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data3[i].event_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data3[i].name;
            cell2.innerHTML = data3[i].type;
            cell3.innerHTML = ev_date;
        }

        // get past transactions
        let url4 = "http://localhost:3000/getlastpurchasedtickets/" + member_id;
        let res4 = await fetch(url4);
        let data4 = await res4.json();
        let table2 = document.getElementById("ticket_tables");
        for (let i = 0; i < data4.length; i++) {
            let row = table2.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data4[i].purchase_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data4[i].ticket_for;
            cell2.innerHTML = data4[i].amount;
            cell3.innerHTML = ev_date;
        }

        // get last shoped arts
        let url5 = "http://localhost:3000/getlastpurchasedarts/" + member_id;
        let res5 = await fetch(url5);
        let data5 = await res5.json();
        let table3 = document.getElementById("shop_tables");
        for (let i = 0; i < data5.length; i++) {
            let row = table3.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data5[i].purchase_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data5[i].title;
            cell2.innerHTML = data5[i].amount;
            cell3.innerHTML = ev_date;
        }
    } catch (err) {
        alert("Error in loading portal page. Please try again later");
    }
}

async function getEmployeePortalDetails(role) {
    var emp_id = 2;
    // getting personal details
    try {
        let url1 = "http://localhost:3000/getemployeedetails/" + emp_id;
        let res1 = await fetch(url1);
        let data1 = await res1.json();
        document.getElementById("first_name").value = data1.personal.first_name;
        document.getElementById("last_name").value = data1.personal.last_name;
        document.getElementById("email").value = data1.personal.email_id;
        document.getElementById("phone").value = data1.personal.phone_no;
        document.getElementById("address1").value = data1.personal.address1;
        document.getElementById("address2").value = data1.personal.address2;
        document.getElementById("city").value = data1.personal.city;
        document.getElementById("state").value = data1.personal.state;
        document.getElementById("zip").value = data1.personal.zipcode;
        document.getElementById("username").value = data1.login.username;
        document.getElementById("pass").value = data1.login.password;
        document.getElementById("employee_id").innerText = data1.personal.emp_id;
        document.getElementById("role").value = data1.personal.role;
        let hire_date = data1.personal.hire_date;
        hire_date = hire_date.split("T")[0];
        document.getElementById("hire_date").value = hire_date;
        let is_active = data1.personal.is_active;
        if (is_active == 'Y') {
            document.getElementById("act_emp").value = 'Yes';
        } else {
            document.getElementById("act_emp").value = 'No';
        }

        // get employee upcoming events
        let url2 = "http://localhost:3000/getupcomingemployeeevents/" + emp_id;
        let res2 = await fetch(url2);
        let data2 = await res2.json();
        let table1 = document.getElementById("event_tables");
        for (let i = 0; i < data2.length; i++) {
            let row = table1.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data2[i].event_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data2[i].name;
            cell2.innerHTML = data2[i].type;
            cell3.innerHTML = ev_date;
        }

        // get past transactions
        let url4 = "http://localhost:3000/getlastpurchasedticketsemployees/" + emp_id;
        let res4 = await fetch(url4);
        let data4 = await res4.json();
        let table2 = document.getElementById("ticket_tables");
        for (let i = 0; i < data4.length; i++) {
            let row = table2.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data4[i].purchase_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data4[i].ticket_for;
            cell2.innerHTML = data4[i].amount;
            cell3.innerHTML = ev_date;
        }

        // get last shoped arts
        let url5 = "http://localhost:3000/getlastpurchasedartsemployees/" + emp_id;
        let res5 = await fetch(url5);
        let data5 = await res5.json();
        let table3 = document.getElementById("shop_tables");
        for (let i = 0; i < data5.length; i++) {
            let row = table3.insertRow(i + 1);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let ev_date = data5[i].purchase_date;
            ev_date = ev_date.split("T")[0];
            cell1.innerHTML = data5[i].title;
            cell2.innerHTML = data5[i].amount;
            cell3.innerHTML = ev_date;
        }

        if (role == "manager"){
            let ev_date = document.getElementById("ev_date").value;
            // set ev_date min value to today
            let today = new Date();
            let dd = String(today.getDate()).padStart(2, '0');
            let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            let yyyy = today.getFullYear();
            today = yyyy + '-' + mm + '-' + dd;
            document.getElementById("ev_date").setAttribute("min", today);

            let url6 = "http://localhost:3000/getSiteLocations/";
            let res6 = await fetch(url6);
            let data6 = await res6.json();
            // set options for select ev_site
            let select = document.getElementById("ev_site");
            let art_select1 = document.getElementById("art_site");
            for (let i = 0; i < data6.length; i++) {
                let opt = data6[i].loc_site;
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);
                art_select1.appendChild(el.cloneNode(true));
            }

            let url7 = "http://localhost:3000/getRoomNumbers/";
            let res7 = await fetch(url7);
            let data7 = await res7.json();
            // set options for select ev_room
            let select1 = document.getElementById("ev_room");
            let art_select2 = document.getElementById("art_room");
            for (let i = 0; i < data7.length; i++) {
                let opt = data7[i].loc_room;
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                select1.appendChild(el);
                art_select2.appendChild(el.cloneNode(true));
            }

            let url8 = "http://localhost:3000/getWorkers/";
            let res8 = await fetch(url8);
            let data8 = await res8.json();
            // set options for select ev_employees
            let select2 = document.getElementById("ev_employees");
            for (let i = 0; i < data8.length; i++) {
                let opt = data8[i].first_name + " " + data8[i].last_name;
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = data8[i].emp_id;
                select2.appendChild(el);
            }

            let url9 = "http://localhost:3000/getObjClass/";
            let res9 = await fetch(url9);
            let data9 = await res9.json();
            // set options for select art_class
            let art_select3 = document.getElementById("art_type");
            for (let i = 0; i < data9.length; i++) {
                let opt = data9[i].obj_class;
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                art_select3.appendChild(el);
            }
        }

    } catch (err) {
        console.log(err);
        alert("Error in loading portal page. Please try again later");
    }
}

async function updatePersonalDetails(user_type) {
    let user_id = 0;
    if (user_type == 'member') {
        user_id = parseInt(document.getElementById("member_id").innerText);
    } else {
        user_id = parseInt(document.getElementById("employee_id").innerText);
    }

    var email = document.getElementById("email").value;
    var phone = document.getElementById("phone").value;
    var address1 = document.getElementById("address1").value;
    var address2 = document.getElementById("address2").value;
    var city = document.getElementById("city").value;
    var state = document.getElementById("state").value;
    var zip = document.getElementById("zip").value;

    if (email == "" || email == null || email == undefined){
        alert("Please enter email");
        return;
    }
    if (phone == "" || phone == null || phone == undefined){
        alert("Please enter phone");
        return;
    }
    if (address1 == "" || address1 == null || address1 == undefined){
        alert("Please enter address1");
        return;
    }
    if (city == "" || city == null || city == undefined){
        alert("Please enter city");
        return;
    }
    if (state == "" || state == null || state == undefined){
        alert("Please enter state");
        return;
    }
    if (zip == "" || zip == null || zip == undefined){
        alert("Please enter zip");
        return;
    }
    
    let data1 = [{
        email: email,
        phone: phone,
        address1: address1,
        address2: address2,
        city: city,
        state: state,
        zip: zip,
        user_type: user_type,
    }]

    let config1 = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(data1)
    }
    try {
        let url1 = "http://localhost:3000/updatememberdetails/" + user_id;
        let res1 = await fetch(url1, config1);
        if (res1.status == 200) {
            alert("Personal details updated successfully");
            // send update details mail
            let url2 = "http://localhost:3000/sendEmails/";
            var data3 = [{"email_type":"update_details","email_list":email}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data3)
            };
            var res2 = await fetch(url2, config2);
        } else {
            alert("Personal details update failed. Please try again later");
        }
    } catch (err) {
        alert("Personal details update failed. Please try again later");
    }
}

async function updateLoginDetails(user_type) {
    let user_id = 0;
    if (user_type == 'member') {
        user_id = parseInt(document.getElementById("member_id").innerText);
    } else {
        user_id = parseInt(document.getElementById("employee_id").innerText);
    }

    var username = document.getElementById("username").value;
    var pass = document.getElementById("pass").value;

    var email = document.getElementById("email").value;

    if (pass == "" || pass == null || pass == undefined){
        alert("Please enter password");
        return;
    }

    let data1 = [{
        username: username,
        password: pass,
        user_type: user_type
    }]

    let config1 = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(data1)
    }
    try {
        let url1 = "http://localhost:3000/updatelogindetails/" + user_id;
        let res1 = await fetch(url1, config1);
        if (res1.status == 200) {
            alert("Login details updated successfully");
            // send update details mail
            let url2 = "http://localhost:3000/sendEmails/";
            var data3 = [{"email_type":"update_details","email_list":email}];
            const config2 = {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                method: 'POST',
                body: JSON.stringify(data3)
            };
            var res2 = await fetch(url2, config2);
        } else {
            alert("Login details update failed. Please try again later");
        }
    } catch (err) {
        alert("Login details update failed. Please try again later");
    }
}