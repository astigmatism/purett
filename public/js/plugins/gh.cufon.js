//be sure cufon and all fonts have script ref in layout (cannot be dynamically loaded!!!)
gh.cufon = {
    initialize: function() {
     $(document).ready(function() {
     
            //sansation
            if ($('.sansation').length > 0) {
                $('.sansation').removeClass('invisible');
                Cufon.replace('.sansation', { fontFamily: 'Sansation', hover: true });
                Cufon.replace('.sansation_bold', { fontFamily: 'Sansation Bold', hover: true });
            }
            
            //colaborate
            if ($('.colaborate').length > 0) {
                $('.colaborate').removeClass('invisible');
                Cufon.replace('.colaborate', { fontFamily: 'Colaborate-Regular', hover: true });
            }
            
            //boister
            if ($('.boister').length > 0) {
                $('.boister').removeClass('invisible');
                Cufon.replace('.boister', { fontFamily: 'BoisterBlack', hover: true });
            }
        });
    }
};
gh.cufon.initialize();