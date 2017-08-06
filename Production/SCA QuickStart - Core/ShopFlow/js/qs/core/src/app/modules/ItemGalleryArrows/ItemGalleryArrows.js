define('ItemGalleryArrows',['ItemDetails.View'],function(View){

    return {
        mountToApp: function(application){
            var Layout = application.getLayout();
            Layout.on('afterAppendView',function(view){
                if(view instanceof View){
                    jQuery(document).on('keydown',function(e) {
                        if(e.which == 37){
                            view.imageGallery && view.imageGallery.$slider && view.imageGallery.$slider.goToPrevSlide()
                        }else if(e.which == 39){
                            view.imageGallery && view.imageGallery.$slider && view.imageGallery.$slider.goToNextSlide()
                        }
                    });
                }
                else{
                    jQuery(document).off('keydown');
                }
            });
        }
    }
});