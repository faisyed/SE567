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
    console.log(event_id);
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
    } catch (err) {
        alert("Error in fetching event details");
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
        window.location.assign('./single-event.html?ev_id='+ev_id);
    } else if (event_type == "exhibitions"){
        window.location.assign('./single-exhibition.html?ev_id='+ev_id);
    } else if (event_type == "auctions"){
        window.location.assign('./single-auction.html?ev_id='+ev_id);
    }
}

