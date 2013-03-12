$(function() {

    // toggle
    $('.toggle').bind('click',function() {
        $('.toggle').removeClass('active');
        $(this).addClass('active')
        var calc = $('.toggle.active').attr('id').split('_')[1];
        $('.calculator, .column.right').hide();
        $('.calculator.' + calc).show();
        $('.column.right.' + calc).show();
        if(calc=='lng') { calculate_lng() } else { calculate_cng(); }

        $('.' + calc + ' .slider').each(function() {
            var field = $(this).attr('field');
            var val = $(this).slider('option','value');
            var decimals = $(this).attr('decimals') || 0;
            $(this).parents('.calculator:first').find('.value[field="' + field + '"]').html(addCommas(val));
        });

    })

    // LNG
    $('.lng .slider[field="fleet_size"]').slider({          range:'min',    min:1,      max:100,                value:5 });                    // Fleet size
    $('.lng .slider[field="avg_mpy"]').slider({             range:'min',    min:5000,   max:200000, step:100,   value:50000 });       // Average miles/year
    $('.lng .slider[field="avg_diesel_mpg"]').slider({      range:'min',    min:3,      max:10,     step:.1,    value:6 });         // Average Diesel MPG
    $('.lng .slider[field="diesel_cost"]').slider({         range:'min',    min:3,      max:8,      step:.25,   value:4.5 });           // Diesel Cost
    $('.lng .slider[field="natural_gas_cost"]').slider({    range:'min',    min:.5,     max:4,      step:.25,   value:1.75 });     // Natural Gas Cost
    $('.lng .slider[field="inc_ng_truck_cost"]').slider({   range:'min',    min:0,      max:60000,  step:100,   value:50000}); // Incremental NG Truck Cost
    $('.lng .slider[field="gov_incentives"]').slider({      range:'min',    min:0,      max:50000,  step:100,   value:32000 });    // Government Incentives

    // CNG
    $('.cng .slider[field="fleet_size"]').slider({          range:'min',    min:1,      max:100,                value:10});                    // Fleet size
    $('.cng .slider[field="avg_mpy"]').slider({             range:'min',    min:5000,   max:200000, step:100,   value:50000 });       // Average miles/year
    $('.cng .slider[field="avg_diesel_mpg"]').slider({      range:'min',    min:3,      max:10,     step:.1,    value:6 });         // Average Diesel MPG
    $('.cng .slider[field="diesel_cost"]').slider({         range:'min',    min:3,      max:8,      step:.25,   value:4.5 });           // Diesel Cost
    $('.cng .slider[field="natural_gas_cost"]').slider({    range:'min',    min:.5,     max:4,      step:.25,   value:1.75 });     // Natural Gas Cost
    $('.cng .slider[field="inc_ng_truck_cost"]').slider({   range:'min',    min:0,      max:60000,  step:100,   value:50000 }); // Incremental NG Truck Cost
    $('.cng .slider[field="gov_incentives"]').slider({      range:'min',    min:0,      max:50000,  step:100,   value:32000 });    // Government Incentives

    $('.slider').each(function() {
        var field = $(this).attr('field');
        var val = $(this).slider('option','value');
        var decimals = $(this).attr('decimals') || 0;
        $(this).parents('.calculator:first').find('.value[field="' + field + '"]').html(addCommas(val));
    });

    // hook all sliders to their span.value (display)
    $('.slider').bind('slide',function(e, ui) {
        var field = $(this).attr('field');
        var value = ui.value;
        var $matchingElem = $('.value[field="' + field + '"]')
        var decimals = $matchingElem.attr('decimals') || 0
        $matchingElem.text(addCommas(value.toFixed(decimals)))
        calculate_cng();
        calculate_lng();
    }).bind('slidechange', function() {
        calculate_cng();
        calculate_lng();
    })

    // calculate after everything is ready
    calculate_cng();

});


// calculations
///////////////////////////////////////////////////////////////////

function calculate_cng() {

    var fleet_size =        $('.cng .slider[field="fleet_size"]').slider('option', 'value');
    var avg_mpy =           $('.cng .slider[field="avg_mpy"]').slider('option', 'value');
    var avg_diesel_mpg =    $('.cng .slider[field="avg_diesel_mpg"]').slider('option', 'value');
    var diesel_cost =       $('.cng .slider[field="diesel_cost"]').slider('option', 'value');
    var natural_gas_cost =  $('.cng .slider[field="natural_gas_cost"]').slider('option', 'value');
    var inc_ng_truck_cost = $('.cng .slider[field="inc_ng_truck_cost"]').slider('option', 'value');
    var gov_incentives =    $('.cng .slider[field="gov_incentives"]').slider('option', 'value');

    var gallons_used_diesel_total = (avg_mpy * fleet_size) / avg_diesel_mpg
    var gallons_used_diesel_price = (avg_mpy * fleet_size) / avg_diesel_mpg * diesel_cost;

    var gallons_used_ng_total = (fleet_size * avg_mpy) / (avg_diesel_mpg * 0.9);
    var gallons_used_ng_price = (fleet_size * avg_mpy) / (avg_diesel_mpg * 0.9) * natural_gas_cost;

    var savings = gallons_used_diesel_price - gallons_used_ng_price;

    // done with calculations, apply rounding and formatting
    $('.cng .calculation[field="gallons_used_diesel_total"]').text(addCommas(Math.round(gallons_used_diesel_total)));
    $('.cng .calculation[field="gallons_used_diesel_price"]').text(addCommas(Math.round(gallons_used_diesel_price).toFixed()));

    $('.cng .calculation[field="gallons_used_ng_total"]').text(addCommas(Math.round(gallons_used_ng_total)));
    $('.cng .calculation[field="gallons_used_ng_price"]').text(addCommas(Math.round(gallons_used_ng_price).toFixed()));

    $('.cng .calculation[field="savings"]').html(asSpanTags(addCommas(savings.toFixed())));

    $('.cng .calculation[field="payback"]').html((((inc_ng_truck_cost - gov_incentives) * fleet_size) / savings).toFixed(2));

}

function calculate_lng() {

    var fleet_size =        $('.lng .slider[field="fleet_size"]').slider('option', 'value');
    var avg_mpy =           $('.lng .slider[field="avg_mpy"]').slider('option', 'value');
    var avg_diesel_mpg =    $('.lng .slider[field="avg_diesel_mpg"]').slider('option', 'value');
    var diesel_cost =       $('.lng .slider[field="diesel_cost"]').slider('option', 'value');
    var natural_gas_cost =  $('.lng .slider[field="natural_gas_cost"]').slider('option', 'value');
    var inc_ng_truck_cost = $('.lng .slider[field="inc_ng_truck_cost"]').slider('option', 'value');
    var gov_incentives =    $('.lng .slider[field="gov_incentives"]').slider('option', 'value');

    var gallons_used_diesel_total = (avg_mpy * fleet_size) / avg_diesel_mpg
    var gallons_used_diesel_price = (avg_mpy * fleet_size) / avg_diesel_mpg * diesel_cost;

    var gallons_used_ng_total = (fleet_size * avg_mpy) / (avg_diesel_mpg * 0.9);
    var gallons_used_ng_price = (fleet_size * avg_mpy) / (avg_diesel_mpg * 0.9) * natural_gas_cost;

    var savings = gallons_used_diesel_price - gallons_used_ng_price;

    // done with calculations, apply rounding and formatting
    $('.lng .calculation[field="gallons_used_diesel_total"]').text(addCommas(Math.round(gallons_used_diesel_total)));
    $('.lng .calculation[field="gallons_used_diesel_price"]').text(addCommas(Math.round(gallons_used_diesel_price).toFixed()));

    $('.lng .calculation[field="gallons_used_ng_total"]').text(addCommas(Math.round(gallons_used_ng_total)));
    $('.lng .calculation[field="gallons_used_ng_price"]').text(addCommas(Math.round(gallons_used_ng_price).toFixed()));

    $('.lng .calculation[field="savings"]').html(asSpanTags(addCommas(savings.toFixed())));

    $('.lng .calculation[field="payback"]').html((((inc_ng_truck_cost - gov_incentives) * fleet_size) / savings).toFixed(2));

}


// utility functions
function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function asSpanTags(value) {
    var html = '';
    var chars = value.split('');
    for(c in chars) {
        if(chars[c] == ',') {
            //html+= '<img src="./icon_comma.gif">';
            html+= '<span class="comma"></span>';
        } else {
            html+= '<span class="num">' + chars[c] + '</span>';
        }
    }
    return html;
}