

async function getSessionInfo() {
  let url1 = "http://localhost:3000/getSessionInfo/";
  let res1 = await fetch(url1);
  let data1 = await res1.json();
  return {"user_type":data1.user_type,"user_id":data1.user_id,"loggedin":data1.loggedin};
}

function handle_tabs(session){
  if (session.loggedin == false || session.loggedin == undefined || session.loggedin == null){
      document.getElementById("drop_account").style.display = "block";
      document.getElementById("drop_portal").style.display = "none";
      document.getElementById("drop_logout").style.display = "none";
  } else {
      document.getElementById("drop_account").style.display = "none";
      document.getElementById("drop_portal").style.display = "block";
      document.getElementById("drop_logout").style.display = "block";
      document.getElementById("drop_auction").style.display = "block";
      if (session.user_type == "M"){
          document.getElementById("portal_page").href = "member-portal.html";
      } else if(session.user_type == "E") {
          document.getElementById("portal_page").href = "employee-portal.html";
      } else if(session.user_type == "C") {
          document.getElementById("portal_page").href = "manager-portal.html";
      }
  }
}
async function logout(){
  let url1 = "http://localhost:3000/logout/";
  let res1 = await fetch(url1);
  if (res1.status == 200){
      window.location.href = "http://localhost:3000/";
  }
}

const getArts = async (filter, filter_value) => {
  
  let session_info = await getSessionInfo();
  handle_tabs(session_info);

  const DOMStrings = {
    collection_list: document.getElementById("collection_list"),
    parentDivBtn: document.getElementById("pagination_btn")
  };

  //remove the link, buttons and list enteries
   const clearResults = () => {
     DOMStrings.collection_list.innerHTML = '';
     DOMStrings.parentDivBtn.innerHTML = '';
   };

  //array
  var collections = [];

  const loadCollection = async () => {
    if(filter === "type"){
      const data = {
        "type" : filter_value
      }
      const config = {
          method: 'POST',
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
      };
      try {
          const fetchResponse = await fetch('http://localhost:3000/getArtsCol/', config);
          const data = await fetchResponse.json();
          return data;
      } catch (e) {
          return e;
      }
    } else {
        var url = 'http://localhost:3000/getArts/';
        if(filter === "key"){
            url = 'http://localhost:3000/searchKey/?'+filter + '=' + filter_value;
        } else if(filter === "name"){
            url = 'http://localhost:3000/searchName/?'+filter + '=' + filter_value;
          } else if(filter=="price"){
              const myArray = filter_value.split("-");
              let from=myArray[0];
              let to=myArray[1];
              if(parseInt(from)<=parseInt(to)) {
                url='http://localhost:3000/searchPrice?from' +'='+ from + "&to="+to; 

              }
              else{
                alert("Enter a valid range!");
                location.reload();

              }


        }
        try {
            return await fetch(url)
            .then(res => {
                  if (res.status == 200) {
                    return res.json();
                  } else {
                    throw new Error(res.status);
                  }
            });;
        } catch(error) {
            console.log(error)
        }

    }
  }


  //add the collections to the UI
  const renderCollections = (art) =>{
    const list = `<div class="col-12 col-sm-6 col-md-4 mimItem px-xl-4">
                      <article class="collectionColumn mb-6 mb-xl-8 position-relative">
                        <div class="imgHolder mb-4" >
                          <a href="single-works.html?id=${art.id}">
                            <img src=${art.url} class="img-fluid d-block" alt="image description">
                          </a>
                        </div>
                        <h2 class="mb-1"><a href="single-works.html?id=${art.id}">${art.title}</a></h2>
                        <h3 class="fontAlter text-gray777 mb-0">${art.author}</h3>
                      </article>
                    </div>`
    DOMStrings.collection_list.insertAdjacentHTML('beforeend', list);
  };

  //add the buttons to the UI
  const renderButton = (page, type) =>
  `<button class="pageBtn ${type}" type="button" data-goto="${type === 'prev'? page - 1 : page + 1}"><i class="fas fa-caret-${type === 'prev'? 'left': 'right'}"></i> Page ${type === 'prev'? page -1 : page + 1}</button>`;

  //set the buttons as per the data and pages
  const calcPage = (page, numCollections, resPerPage) => {
    const totalPages = Math.ceil(numCollections/resPerPage);
    let final;
    if(page === 1 && totalPages > 1){
      final = renderButton(page, 'next');
      }
    else if(page < totalPages){
      final = `${renderButton(page, 'prev')} ${renderButton(page, 'next')}`;
      }
    else if(page === totalPages && totalPages > 1){
      final = renderButton(page, 'prev');
    } else if(totalPages === 1) {
      final = "";
    }

    DOMStrings.parentDivBtn.insertAdjacentHTML('afterbegin', final);
  };

  //set the page, result per page, loop and pass each art
  //page and resPerPage are default parameters
  const getPage = (collections, page = 1, resPerPage = 12) => {
    clearResults();
    const first = (page - 1) * resPerPage;
    const end = page * resPerPage;
    collections.slice(first, end).forEach(renderCollections);
    let count = collections.slice(first, end).length > resPerPage ? resPerPage : collections.slice(first, end).length;
    document.getElementById("art_count").innerHTML = `Showing ${count} Art works`;
    calcPage(page, collections.length, resPerPage);

  };

  //Event delegation using the Div to add listener to the button inside
  DOMStrings.parentDivBtn.addEventListener('click', (e) =>{
      const button = e.target.closest('.pageBtn');
      if(button){
        clearResults();
        const goto = parseInt(button.dataset.goto, 10);
        getPage(collections, goto);
      }
  });

  clearResults();
  collections = []
  let data = loadCollection();
  console.log(collections)
  data.then(arts => {
            collections =  arts
      }).then(() => {
          if(collections.length == 0){
              var list = '<h4>No art collection match with your search criteria</h4>'
              DOMStrings.collection_list.insertAdjacentHTML('beforeend', list);
          } else {
              getPage(collections);
          }
      })

}

const getArt = async () => {
  
  let session_info = await getSessionInfo();
  handle_tabs(session_info);

  const DOMStrings = {
      art_image: document.getElementById("art_image"),
      caption: document.getElementById("image_caption"),
      title: document.getElementById("image_title"),
      author_desc: document.getElementById("author_desc"),
      description: document.getElementById("description"),
      artist: document.getElementById("artist"),
      year: document.getElementById("year"),
      location: document.getElementById("location"),
      material: document.getElementById("material"),
      class: document.getElementById("class"),
      dimensions: document.getElementById("dimensions"),
      price: document.getElementById("price"),
    };
  var art = {}
  const urlParams = new URLSearchParams(window.location.search);
  const fetchArt = async () => {
      try {
             return await fetch('http://localhost:3000/getArt?id='+urlParams.get('id'))
            .then(res => {
                  if (res.status == 200) {
                      return res.json();
                  } else {
                    throw new Error(res.status);
                  }
            });;
      } catch(error) {
        console.log(error)
      }
  }

  const getPage = () => {
      fetchArt().then(obj => {
          art =  obj[0]
      }).then(() => {
          DOMStrings.art_image.src = art.img_url;
          DOMStrings.caption.innerHTML = art.obj_title;
          DOMStrings.title.innerHTML = art.obj_title;
          DOMStrings.author_desc.innerHTML = art.obj_attribution + '(' +art.obj_beginyear +'-'+art.obj_endyear +')';
          DOMStrings.description.innerHTML = art.obj_inscription;
          DOMStrings.artist.innerHTML = art.obj_attribution;
          DOMStrings.year.innerHTML = art.obj_beginyear +'-'+art.obj_endyear;
          DOMStrings.location.innerHTML = art.loc_room + ','+ art.loc_site+','+ art.loc_description ;
          DOMStrings.material.innerHTML = art.obj_medium;
          DOMStrings.class.innerHTML = art.obj_class;
          DOMStrings.dimensions.innerHTML = art.obj_dimensions;
          DOMStrings.price.innerHTML = art.price;
      });
  }

  getPage();
}

const payment = async () => {
try {
      await fetch('http://localhost:3000/loadPayPal')
      .then(res => {
            if (res.status == 200) {
                return res.json();
            } else {
              throw new Error(res.status);
            }
      })
      .then(json => {
        sessionStorage.setItem("access_token", json.access_token);
        sessionStorage.setItem("client_token", json.client_token);
        sessionStorage.setItem("client_id", json.client_id);
      })

} catch(error) {
  console.log(error)
}

const price = document.getElementById("price").innerHTML;
const urlSearchParams = new URLSearchParams(window.location.search);
window.location.assign(`./payment.html?id=${urlSearchParams.get("id")}&pay=${price}`);
}

function showExample(){
  console.log("function showExample")
  let var1=document.getElementById("search_type").value;
  console.log(var1)
  if(var1=='price'){
    document.getElementById("example_price").style.display="initial";
  }
  else{
    document.getElementById("example_price").style.display="none";
  }
}