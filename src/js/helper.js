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
            html+= '<a href="javascript:setAndCallEventDetail('+'\''+event_type+'\''+','+data[i].ev_id+')">'+ data[i].ev_name +'</a>';
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
            html+= '<a href="javascript:setAndCallEventDetail('+'\''+event_type+'\''+','+data[i].ev_id+')">'+ data[i].ev_name +'</a>';
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

async function setAndCallEventDetail(event_type,ev_id){
    if (event_type == "shows"){
        window.location.assign('./single-show.html?ev_id='+ev_id);
    } else if (event_type == "exhibitions"){
        window.location.assign('./single-exhibition.html?ev_id='+ev_id);
    } else if (event_type == "auctions"){
        window.location.assign('./single-auction.html?ev_id='+ev_id); 
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
        var url1 = "http://localhost:3000/buyEntryTicket/";
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