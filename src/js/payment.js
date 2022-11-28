// @TODO Login to developer.paypal.com, create (or select an existing)
const buyArt = async () => {
  
  const urlSearchParams = new URLSearchParams(window.location.search);
  const entires = Object.fromEntries(urlSearchParams.entries());

  document.getElementById('paymentPrice').innerHTML  = entires.pay;
  document.getElementById('paymentDetails').style.display = 'initial';
  
  const objId =  entires.id;
  const paymentPrice = entires.pay;
  let userId = undefined;

  paypal.Buttons({
    style: {
      layout: 'horizontal'
    },
     createOrder: async function(data, actions) {
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
        } 
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(async function(details) {
          const utype = document.getElementById("user_type").value;
          console.log("user details after approval",userId,utype,objId);
          return onShopTransactionSuccess(objId,userId,utype);
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
          document.getElementById('credit-card-payment-buttom').value = "Pay";
        }
      }
    }).then(function (hostedFields) {
      document.querySelector("#card-form").addEventListener('submit', (event) => {
         event.preventDefault();

         hostedFields.submit().then( async () => {
           const res = await fetch(`/capture-order/${orderId}`, { method: 'POST' });
           const { status } = await res.json();
           if (status === 'COMPLETED') {
              const utype = document.getElementById("user_type").value;
              console.log("user details after card paymenty",userId,utype,objId);
              return onShopTransactionSuccess(objId, userId, utype);
           } else {
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

const onShopTransactionSuccess = async (objId, userId, userType) => {
  if (!!userId){        
    const completed = await addArtToDatabase(objId, userId, userType);
    console.log("transaction status",completed);
    if (completed){
      window.location.href = '/payment-success.html';
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
  const userType = document.getElementById("user_type").value;

  if (userType === 'M'){
    //get id from member table
    try{
      return await fetch(`http://localhost:3000/getMemberId?first_name=${firstName}&last_name=${lastName}`)
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
        let user = {};
        user["id"] = json.id;
        return user;
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
      return await fetch(`http://localhost:3000/getEmployeeId?first_name=${firstName}&last_name=${lastName}`)
      .then(res => {
            if (res.status == 200) {
                return res.json();
            }else {
              throw new Error(res.status);
            }
      })
      .then(json => {
        //get member id and try to insert in the database
        let user = {};
        user["id"] = json.id;
        return user;
      })
    }
    catch(err){
      console.error("Error requesting employee data"+err);
      alert("Error requesting employee data");
    }
  }
  else{
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