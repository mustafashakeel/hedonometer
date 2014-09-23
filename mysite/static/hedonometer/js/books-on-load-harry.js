// begin with some helper functions
// http://stackoverflow.com/a/1026087/3780153
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// this works really well, but it's deadly slow (working max 5 elements)
// and it's coupled to jquery
// http://stackoverflow.com/a/5047712/3780153
String.prototype.width = function(font) {
    var f = font || '12px arial',
    o = $('<div>' + this + '</div>')
	.css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
	.appendTo($('body')),
    w = o.width();
    o.remove();
    return w;
}

// yup
// http://stackoverflow.com/questions/3883342/add-commas-to-a-number-in-jquery
function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
	val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

// set the default here
var bookDecoder = d3.urllib.decoder().varresult("Harry Potter (all books together)").varname("book");
var bookEncoder = d3.urllib.encoder().varname("book");

var ignoreWords = [];
var bookinfo = {};

function initializePlot() {
    book = bookDecoder().cached;
    // console.log("not a classic");
    // hit the random api
    d3.json("/api/v1/gutenberg/?format=json&title__exact="+book,function(data) {
	var result = data.objects[0];
	console.log(result);
	lang = result.language;
	var booktitle = d3.select("#booktitle");
	var title = booktitle.append("h2").text(result.title+" ");
	// title.append("small").text("by "+result.author);
	var bookauthor = d3.select("#bookauthor");
	var author = booktitle.append("h2").append("small").text("by "+result.author);
	var newignore = result.ignorewords.split(",");
	for (var i=0; i<newignore.length-1; i++) {
	    ignoreWords.push(newignore[i]);
	}
	console.log(ignoreWords);
	// set the filename
	book = result.reference;
	sumWords = result['length'];
	bookinfo.lang = lang;
	bookinfo.title = result.title;
	bookinfo.author = result.author;
	loadCsv();
    })
}

function loadCsv() {
    var csvLoadsRemaining = 4;
    var bookfile = "/static/hedonometer/data/bookdata/processed/"+book+"-timeseries.csv";
    d3.text(bookfile, function (text) {
	var tmpminwin = 10;
	fulltimeseries = text.split(",").map(parseFloat);
	begtimeseries = fulltimeseries.slice(0,tmpminwin/2+1);
	endtimeseries = fulltimeseries.slice(fulltimeseries.length-1-tmpminwin/2,fulltimeseries.length);
	timeseries = fulltimeseries.slice(tmpminwin/2,fulltimeseries.length-tmpminwin/2);
        if (!--csvLoadsRemaining) initializePlotPlot(lens, words);
    });
    d3.text("/static/hedonometer/data/bookdata/labMT/labMTscores-"+lang+".csv", function (text) {
        var tmp = text.split("\n");
        //console.log(tmp.length);
        //console.log(tmp[tmp.length-1]);
        lens = tmp.map(parseFloat);
        var len = lens.length - 1;
        while (!lens[len]) {
            //console.log("in while loop");
            lens = lens.slice(0, len);
            len--;
        }
        if (!--csvLoadsRemaining) initializePlotPlot(lens, words);
    });
    d3.text("/static/hedonometer/data/bookdata/labMT/labMTwords-"+lang+".csv", function (text) {
        var tmp = text.split("\n");
        words = tmp;
        var len = words.length - 1;
        while (!words[len]) {
            //console.log("in while loop");
            words = words.slice(0, len);
            len--;
        }
        if (!--csvLoadsRemaining) initializePlotPlot(lens, words);
    });
    d3.text("/static/hedonometer/data/bookdata/labMT/labMTwordsEn-"+lang+".csv", function (text) {
        var tmp = text.split("\n");
        words_en = tmp;
        var len = words_en.length - 1;
        while (!words_en[len]) {
            //console.log("in while loop");
            words_en = words_en.slice(0, len);
            len--;
        }
        if (!--csvLoadsRemaining) initializePlotPlot(lens, words);
    });
};

function initializePlotPlot(lens, words) {
    // initially apply the lens
    var minSize = 10000;
    var dataSize = 1000;
    minWindows = Math.round(minSize / dataSize);

    lensDecoder = d3.urllib.decoder().varresult([3,7]).varname("lens");

    lensExtent = lensDecoder().cached.map(parseFloat);
    
    // ignore these on all
    var alwaysIgnore = ["nigga","niggaz","niggas","nigger"]; //["cried", "cry", "coffin"];
    for (var i=0; i<alwaysIgnore.length; i++) {
	ignoreWords.push(alwaysIgnore[i]);
    }
    refFextentDecoder = d3.urllib.decoder().varresult([0,.2]).varname("refExtent");				      
    refFextent = [Math.round(parseFloat(refFextentDecoder().cached[0])*fulltimeseries.length), Math.round(parseFloat(refFextentDecoder().cached[1])*fulltimeseries.length)];
    compFextentDecoder = d3.urllib.decoder().varresult([.8,1]).varname("compExtent");				      
    compFextent = [Math.round(parseFloat(compFextentDecoder().cached[0])*fulltimeseries.length), Math.round(parseFloat(compFextentDecoder().cached[1])*fulltimeseries.length)];
    


    // only draw the lens is the page is wide enough
    // this approach is terrible
    // if (parseInt(d3.select("#lens01").style("width")) > 100) {
    // 	drawLens(d3.select("#lens01"), lens);
    // }

    // doesn't need to return anything, uses globals
    // timeseries = computeHapps();
    selectChapterTop(d3.select("#chapters01"), timeseries.length);

    console.log(timeseries);
    drawBookTimeseries(d3.select("#chapters03"),timeseries);
    selectChapter(d3.select("#chapters02"), timeseries.length);
};

// make the whole thing
initializePlot();

var loadwordshift = function() {
    var bookfile = "/static/hedonometer/data/bookdata/processed/"+book+"-timeseries.csv";
    d3.text(bookfile, function (text) {
        tmp = text.split("\n");
        // kill extra rows
        var len = tmp.length - 1;
        //while (!tmp[len]) { console.log("in while loop"); tmp = tmp.slice(0,len); len--; } p
        // build the full data, terrible
        allDataRaw = Array(tmp[0].split(',').length);
        //allData = Array(tmp[0].split(',').length);
        for (var i = 0; i < tmp[0].split(',').length; i++) {
	    allDataRaw[i] = Array(tmp.length);
	    //allData[i] = Array(tmp.length);
        }
        for (var i = 0; i < tmp.length; i++) {
	    var tmpTmp = tmp[i].split(',');
	    for (var j = 0; j < tmpTmp.length; j++) {
                allDataRaw[j][i] = parseFloat(tmpTmp[j]);
	    }
        }
	// console.log(allDataRaw);
	if (sumWords < 10000) { alert("There are too few words in this book for the hedonometer to accurately generate a timeseries. Currently we need at least 10000 words, and this book has "+sumWords+"."); }
        // console.log(d3.sum(allDataRaw[0]));

        // if (!--csvLoadsRemaining) initializePlotPlot(allDataRaw, lens, words);

	// initialize new values
	var refF = Array(allDataRaw[0].length);
	var compF = Array(allDataRaw[0].length);
	allData = Array(allDataRaw.length);
	// fill them with 0's
	for (var i = 0; i < allDataRaw[0].length; i++) {
            refF[i] = 0;
            compF[i] = 0;
	}
	for (var i = 0; i < allDataRaw.length; i++) {
            allData[i] = Array(allDataRaw[i].length);
	}
	// loop over each slice of data
	for (var i = 0; i < allDataRaw[0].length; i++) {
            var include = true;
            for (var k = 0; k < ignoreWords.length; k++) {
		if (ignoreWords[k] == words[i]) {
                    include = false;
		}
            }
            if (lens[i] > lensExtent[0] && lens[i] < lensExtent[1]) {
		include = false;
            }
            // grab the shift vectors
            if (include) {
		for (var k = refFextent[0]; k < refFextent[1]; k++) {
                    refF[i] += parseFloat(allDataRaw[k][i]);
		}
		for (var k = compFextent[0]; k < compFextent[1]; k++) {
                    compF[i] += parseFloat(allDataRaw[k][i]);
		}
		for (var k = 0; k < allDataRaw.length; k++) {
                    allData[k][i] = allDataRaw[k][i];
		}
            }
            // slice up the data
            // for quicker redraw on window selection
            // and happiness calculation
            // double overhead for storage
            else {
		for (var k = 0; k < allData.length; k++) {
                    allData[k][i] = 0;
		}
            }
	}
    });

    shiftObj = shift(refF, compF, lens, words);
    plotShift(d3.select("#figure01"), shiftObj.sortedMag.slice(0, 200),
              shiftObj.sortedType.slice(0, 200),
              shiftObj.sortedWords.slice(0, 200),
              shiftObj.sortedWordsEn.slice(0, 200),
              shiftObj.sumTypes,
              shiftObj.refH,
              shiftObj.compH);

};