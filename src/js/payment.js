
const fetchMemberOfEmployeeDetails = async (userType, userId) => {

  let userDetails = {};
  
  if (userType === 'M'){
    //get member details from member table based on id
    console.log("inside");
    try{
      return await fetch(`http://localhost:3000/getmemberdetails/${userId}`)
      .then(res => {
            if (res.status == 200) {
                return res.json();
            }else {
              throw new Error(res);
            }
      })
      .then(json => {
        //get member id and try to insert in the database
        console.log("found a member in the database",json);
        userDetails["id"] = json.personal.mem_id;
        userDetails["first_name"] = json.personal.first_name;
        userDetails["last_name"] = json.personal.last_name;
        userDetails["email"] = json.personal.email;
        userDetails["phone_no"] = json.personal.phone_no;
        
        return userDetails;
      })
    }
    catch(err){
      console.error("Error requesting member data"+err);
      alert("Error requesting employee data");
      return false;
    }

  } 
  else if (userType === 'E'){
    //get id from employee table
    try{
      return await fetch(`http://localhost:3000/getemployeedetails/${userId}`)
      .then(res => {
            if (res.status == 200) {
                return res.json();
            }else {
              throw new Error(res.status);
            }
      })
      .then(json => {
        console.log("found a member in the database",json);
        userDetails["id"] = json.personal.emp_id;
        userDetails["first_name"] = json.personal.first_name;
        userDetails["last_name"] = json.personal.last_name;
        userDetails["email"] = json.personal.email_id;
        userDetails["phone_no"] = json.personal.phone_no;
        
        return userDetails;
      })
    }
    catch(err){
      console.error("Error requesting employee data"+err);
      alert("Error requesting employee data");
    }
  }

}


const buyArt = async () => {
  let session_info = await getSessionInfo();
  handle_tabs(session_info);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const entires = Object.fromEntries(urlSearchParams.entries());
  console.log("Calling fetching employees",session_info);
  const userDetails = await fetchMemberOfEmployeeDetails(session_info.user_type, session_info.user_id);
  console.log("Calling fetching employees",userDetails);
  if (userDetails){
      document.getElementById("user_first_name").value = userDetails.first_name;
      document.getElementById("user_last_name").value = userDetails.last_name;
      document.getElementById("user_email").value = userDetails.email;
      document.getElementById("user_phone_no").value = userDetails.phone_no;
      document.getElementById("user_type").value = session_info.user_type;
  }


  document.getElementById('paymentPrice').innerHTML  = entires.pay;
  document.getElementById('paymentDetails').style.display = 'initial';
  
  const objId =  entires.id;
  const paymentPrice = entires.pay;
  let userId = !!session_info.user_id;

  paypal.Buttons({
    style: {
      layout: 'horizontal'
    },
     createOrder: async function(data, actions) {
      
      if (session_info.user_type === 'M' || session_info.user_type === 'E'){
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: paymentPrice
            }
          }]
        });
      }
      else{
        const user = await addUserToDatabase();
        if(user){
          userId = user.id;
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: paymentPrice
              }
            }]
          });
        }
        else{
          userId = undefined;
          alert("Error with the user details");
        }}
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(async function(details) {
          const utype = document.getElementById("user_type").value;
          console.log("user details after approval",userId,utype,objId);
          return onShopTransactionSuccess(objId,userId,utype,paymentPrice);
        });
      }
  }).render("#paypal-button-container");

  // Eligibility check for advanced credit and debit card payments
  if (paypal.HostedFields.isEligible()) {
    let orderId;

    paypal.HostedFields.render({
      styles: {
       // Styling element state
       '.valid': {
         'color': 'green'
       },
       '.invalid': {
         'color': 'red'
       }
      },
      fields: {
        number: {
          selector: "#card-number",
          placeholder: "4111 1111 1111 1111"
        },
        cvv: {
          selector: "#cvv",
          placeholder: "123"
        },
        expirationDate: {
          selector: "#expiration-date",
          placeholder: "MM/YY"
        }
      },
      createOrder: async function () {
        document.getElementById('credit-card-payment-buttom').value = "Processing...";
        if (session_info.user_type === 'M' || session_info.user_type === 'E'){
          const res = await fetch(`/create-order?pay=${paymentPrice}`, { method: 'POST' });
          const { id } = await res.json();
          orderId = id;
          return id;
        }
        else{
          const user = await addUserToDatabase();
          if(user){
            userId = user.id;
            const res = await fetch(`/create-order?pay=${paymentPrice}`, { method: 'POST' });
            const { id } = await res.json();
            orderId = id;
            return id;
          }
          else{
            userId = undefined;
            alert("Error with the user details");
            location.reload();
          }
        }
        
      }
    }).then(function (hostedFields) {
      document.querySelector("#card-form").addEventListener('submit', (event) => {
         event.preventDefault();

         hostedFields.submit().then( async () => {
           const res = await fetch(`/capture-order/${orderId}`, { method: 'POST' });
           const { status } = await res.json();
           if (status === 'COMPLETED') {
              document.getElementById('credit-card-payment-buttom').style.display = "none";
              const utype = document.getElementById("user_type").value;
              
              return onShopTransactionSuccess(objId, userId, utype,paymentPrice);
           } else {
             document.getElementById('credit-card-payment-buttom').value = "Pay";
             alert('Payment unsuccessful. Please try again!');
           }
         }).catch((err) => {
           console.error(JSON.stringify(err));
         });
       });
     });
   } else {
     // hides the advanced credit and debit card payments fields, if merchant isn't eligible
     document.querySelector("#card-form").style = 'display: none';
   }
    
}

const onShopTransactionSuccess = async (objId, userId, userType, paymentPrice) => {
  if (!!userId){        
    const completed = await addArtToDatabase(objId, userId, userType);
    console.log("transaction status",completed,paymentPrice);
    if (completed){
      window.location.href = '/payment-success.html?type=1&payment='+paymentPrice;
    }
    else{
      alert('Error saving the transaction info!');
    }
  }
  else{
    alert('Failed to fetch user info, transaction failed');
  }
  
}


const addUserToDatabase = async () => {
  const firstName = document.getElementById("user_first_name").value;
  const lastName = document.getElementById("user_last_name").value;
  const email = document.getElementById("user_email").value;
  const phoneNo = document.getElementById("user_phone_no").value;
  // const userType = document.getElementById("user_type").value;
  
  var data = [{
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'phoneNo': phoneNo
  }];
  const config = {
      headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(data)
  };
  console.log("Request to add visitor",data);
  try{
    return await fetch(`http://localhost:3000/addVisitor`,config)
      .then(res => {
        if (res.status === 200) {
            return res.json();
        }else {
          throw new Error(res.status);
        }
      })
      .then(json => {
        let user = {};
        user["id"] = json.id;
        console.log("fghjkl",user,json);
        return user;
      })
  }
  catch(err){
    console.error("Error adding visitor details"+err);
    alert("Error requesting employee data");
  }
}

const addArtToDatabase = async (objId, userId, userType) => {

  var data = [{
    user_id: userId,
    user_type: userType
  }];
  const config = {
      headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(data)
  };
  var url = "http://localhost:3000/buyArt?id="+objId;


  try {
    return await fetch(url,config)
    .then(res => {
          if (res.status == 200) {
              return true;
          } else {
            throw new Error(res.status);
          }
    });
  } catch(error) {
    console.log("Error inserting into shop transactions"+err);
    return false;
  }
}