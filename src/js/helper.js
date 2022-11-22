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