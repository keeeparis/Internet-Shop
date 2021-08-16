import Splide from '@splidejs/splide';

document.addEventListener('DOMContentLoaded', () => {
    try {
        let secondarySlider = new Splide('#secondary-slider', {
            fixedWidth  : 100,
            height      : 70,
            gap         : 10,
            cover       : true,
            isNavigation: true,
            focus       : 'center',
            pagination: false,
            breakpoints : {
                '600': {
                    fixedWidth: 66,
                    height    : 40,
                }
            }
        }).mount();

        let primarySlider = new Splide('#primary-slider', {
            type: 'fade',
            // heightRatio: 0.65,
            pagination : false,
            arrows     : false,
            // cover      : true,

        });

        primarySlider.sync( secondarySlider ).mount();
    } catch(e) {
        console.log(e.message);
    }
})
