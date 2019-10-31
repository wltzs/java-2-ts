// input stream
function inputStream(pstr){
    var str = pstr,curIndex = 0,row=1,l = pstr.length||0;
    function peek(){
        return str.charAt(curIndex);
    }

    function next(){
        var c = str.charAt(curIndex++);
        if(/\r|\n|\r\n/.test(c)){
            row++;
        }
        return c;
    }

    function eof(){
        return curIndex+1>=l;
    }

    function jumpPeek(off){
        var i = curIndex+off;
        i = i>=0?(i<=l?i:l):0;
        return str.charAt(i);
    }

    function jump(off){
        var i = curIndex+off;
        curIndex = i>=0?(i<=l?i:l):0;
        return str.charAt(curIndex);
    }

    function getCurIndex(){
        return curIndex;
    }

    function setCurIndex(i){
        curIndex = i;
    }
    function nextTextNode(){
        var pre = curIndex;
        curIndex = str.indexOf('<',pre);
        curIndex = curIndex>-1?curIndex:l;
        var txt = str.substring(pre,curIndex),i=0;
        while((i=txt.indexOf('\n',i))>-1){
            row++;
            i++;
        }
        return txt;
    }
    return {
        peek:peek,
        next:next,
        jumpPeek:jumpPeek,
        jump:jump,
        eof:eof,
        getCurIndex:getCurIndex,
        setCurIndex:setCurIndex,
        nextTextNode:nextTextNode,
        row:function(){
            return row;
        }
    };
}

function testInput(){
    var input = inputStream(code);
    while(!input.eof()){
        console.log(input.peek());
        console.log(input.next());
    }
}