//coppy inside .dpt-cat ot .department

function copyMenu() {
    // copy inside .dpt-cat to .department
    var dptCategory = document.querySelector(".dpt-cat")
    var dptPlace = document.querySelector(".departments")
    dptPlace.innerHTML = dptCategory.innerHTML

    //copy inside nav to nav
    var mainNav = document.querySelector('.header-nav nav')
    var navPlace = document.querySelector('.off-canvas nav')
    navPlace.innerHTML = mainNav.innerHTML

    // copy .header-nav .wrapper to .thetop-nav
    var topNav = document.querySelector(".header-top .wrapper")
    var topPlase = document.querySelector(".off-canvas .thetop-nav")
    topPlase.innerHTML= topNav.innerHTML
}
copyMenu();

// show mobile menu
const menuButton = document.querySelector('.trigger'),
        closeButton = document.querySelector('.t-close'),
        addclass = document.querySelector('.site');

    menuButton.addEventListener('click', function() {
        addclass.classList.toggle('showmenu')
       
    })
 closeButton.addEventListener('click',function() {
            addclass.classList.remove('showmenu')
        })
// show sub menu on mobile
const submenu = document.querySelectorAll('.has-child .icon-small')
submenu.forEach((menu) => menu.addEventListener("click",toggle))

function toggle(e) {
    e.preventDefault();
    submenu.forEach((item) => item!= this? item.closest('.has-child').classList.remove('expand') : null)
    if (this.closest('.has-child').classList!= 'expand') {
        this.closest('.has-child').classList.toggle("expand")
    }
}

// slider
const swiper = new Swiper('.swiper', {

    loop: true,
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },
  
  });