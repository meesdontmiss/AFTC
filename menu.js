  jQuery(function () {
  setTimeout(function () {
    jQuery(".dialog-menu a").first().addClass("active");
  }, 1000);
  jQuery(".dialog-menu a").lettering();
  jQuery(".dialog-menu a").on("mouseover", function () {
    jQuery(".dialog-menu a").removeClass("active");
    jQuery(this).addClass("active");
  });
});