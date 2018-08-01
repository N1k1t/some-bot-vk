function getTimestamp(){
	return new Date().getTime();
}
function strEq(firstString, lastString){
	firstString = firstString.trim().toLocaleLowerCase().split(' ');
	lastString = lastString.trim().toLocaleLowerCase().split(' ');

	for ( let part of lastString ){
		if ( firstString.indexOf(part) == -1 ) return false;
	}

	return true;
}
function parseWordByNumber(num, word, secWord, thirdWord){
	let str = String(num);
	let numLength = str.length;
	let lstNum = parseInt( str[ str.length-1 ] , 10 );

	if ( lstNum == 1 && num != 11 ) return word;
	if ( lstNum < 5 && lstNum != 0 && num > 20 ) return secWord;
	if ( numLength == 1 && lstNum < 5 && num > 0 ) return secWord;
	
	return thirdWord;
}

module.exports = {
	getTimestamp: getTimestamp,
	strEq: strEq,
	parseWordByNumber: parseWordByNumber
}