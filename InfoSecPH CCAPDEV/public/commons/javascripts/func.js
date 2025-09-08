//A JQuery example on handling Ajax. It sends a request similar
//to a post but it does not load a file. Instead, it sends info
//back and a call-back function will process what happened.
//Read more here: 
//https://www.w3schools.com/jquery/jquery_ajax_intro.asp

function getLastSegmentOfUrl() {
  const pathname = window.location.pathname; 
  const lastSegment = pathname.split('/').pop(); 
  
  return lastSegment;
}

var pid = ""
// TEST LOGIN (NEED MONGODB TO MAKE LOGIN EASIER)
$(document).ready(function(){
    $("#searchit").click(function(){
      $.post(
        '/search',

        { username: $('#searching').val()},

        function(data, status){
            if(status === 'success' && data.success) {
                window.location.href = '/'
                console.log("success");
            }
            else{
              
            }
        })
    })

    
});//doc
  