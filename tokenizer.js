//tokenizer
function Tokenizer(input){
    var curTokenStr = '',
        curIndex = 0,
        isMarkClosed = true,
        cache = {};
    cur = null,
        pre=null;


    function isIdStart(c){
        return /\_|\:|\@|\$|[a-zA-Z]/.test(c);
    }

    function isIdPart(c){
        return /\_|\:|\@|\$|\-|[a-zA-Z]|\d/.test(c);
    }
    var keys = ' var function return if else while for break continue true false case switch try catch Array String Date in new with';

    function isKeyword(t){
        return keys.indexOf(' '+t+' ')>-1;
    }

    function isPunc(c){
        return ',[]{}();.:\\=\'\"+-*/%!&|<>?'.indexOf(c)>-1;
    }

    function isStringMark(mark){
        var cur = input.peek(),
            pre1 = input.jumpPeek(-1),
            pre2 = input.jumpPeek(-2);
        if(mark){
            return (mark===cur)&&((pre1!='\\')||(pre1=='\\'&&pre2==='\\'));
        }else{
            return (/\'|\"/.test(cur))&&((pre1!='\\')||(pre1=='\\'&&pre2==='\\'));
        }

    }

    function readString(){
        if(isStringMark()){
            var mark = input.next();
            curTokenStr = '';
            while(!isStringMark(mark)&&!input.eof()){
                curTokenStr += input.next();
            }
            input.next();
        }
        return curTokenStr;
    }

    function isNum(){
        return /\d/.test(input.peek());
    }

    function isRegMark(){
        return input.peek()==="/"&&(input.jumpPeek(-1)!='\\');
    }

    function readReg(){
        var scope = [];
        if(isRegMark()){
            input.next();
            curTokenStr = '';
            while(!isRegMark()&&!input.eof()){
                curTokenStr += input.next();
            }
            input.next();
            while(input.peek()==='g'||input.peek()==='i'){
                scope.push(input.next());
            }
        }
        return {t:curTokenStr,type:'reg',r:input.row(),scope:scope};
    }

    function readNum(){
        if(isNum()){
            curTokenStr = input.next();
            var hasDot = false;
            while(isNum()||(input.peek()==='.'&&!hasDot)){
                if(input.peek()==='.'){
                    hasDot = true;
                }
                curTokenStr +=input.next();
            }
            return curTokenStr;
        }
    }

    function readId(){
        if(isIdStart(input.peek())){
            curTokenStr = input.next();
            while(isIdPart(input.peek())){
                curTokenStr += input.next();
            }
        }
        return curTokenStr;
    }
    function isBlank(){
        return /\s/.test(input.peek());
    }

    // skip blank
    function skipBlank(){
        while(isBlank()){
            input.next();
        }
    }

    //skip single
    function skipSingleComment(){
        while(!/\r|\n|\r\n/.test(input.peek())&&!input.eof()){
            input.next();
        }
        input.next();
    }

    //skip multiline notions
    function skipMultiComment(){
        input.next();
        while(!(input.peek()==='/'&&input.jumpPeek(-1)==='*')){
            input.next();
        }
        input.next();
    }

    //is operator start
    function isOpStart(c){
        return /&|\||\!|\?|\+|\-|\*|\/|%|<|>|\=/.test(c);
    }



    function isMark(){
        var t = input.peek();
        return t==='<'||t==='>';
    }

    //next token
    function read(clear,pIndex){
        if(cache[pIndex]){
            pre = cur;
            cur = cache[pIndex];
        }else{
            skipBlank();
            pre = cur;
            if(!isMarkClosed){
                if(isIdStart(input.peek())){
                    curTokenStr = readId();
                    cur = {t:curTokenStr,type:isKeyword(curTokenStr)?'keyword':'id',r:input.row()};
                }else if(isPunc(input.peek())){
                    if(isMark()){
                        curTokenStr = input.next();
                        isMarkClosed = curTokenStr==='>';
                        cur = {t:curTokenStr,type:'punc',r:input.row()};
                    }else if(isStringMark()){
                        curTokenStr = readString();
                        cur = {t:curTokenStr,type:'string',r:input.row()};
                    }else if(isOpStart(input.peek())){

                        if(/&|\|/.test(input.peek())){
                            var punc1 = input.peek(),
                                nextChar = input.jumpPeek(1);
                            if(nextChar===punc1){
                                cur = {t:punc1+punc1,type:'op-bool',r:input.row()};
                                input.jump(2);
                            }else{
                                cur = {t:punc1,type:'op-bit',r:input.row()};
                                input.next();
                            }

                        }else if('!'===input.peek()){
                            var nextChar1 = input.jumpPeek(1),nextChar2 = input.jumpPeek(2);
                            if(nextChar1 === '=' && nextChar2 === '='){
                                cur = {t:'!==',type:'op-bool',r:input.row()};
                                input.jump(3);
                            }else if(nextChar1 === '='){
                                cur = {t:'!=',type:'op-bool',r:input.row()};
                                input.jump(2);
                            }else{
                                cur = {t:'!',type:'op-bool',r:input.row()};
                                input.next();
                            }
                        }else if(/\=/.test(input.peek())){
                            var nextChar1 = input.jumpPeek(1),
                                nextChar2 = input.jumpPeek(2);
                            if(nextChar1 === '=' && nextChar2 === '='){
                                cur = {t:'===',type:'op-bool',r:input.row()};
                                input.jump(3);
                            }else if(nextChar1 === '='){
                                cur = {t:'==',type:'op-bool',r:input.row()};
                                input.jump(2);
                            }else{
                                cur = {t:'=',type:'op-set',r:input.row()};
                                input.next();
                            }
                        }else{
                            curTokenStr = input.next();
                            cur = {t:curTokenStr,type:'punc',r:input.row()};
                        }

                    }else{
                        curTokenStr = input.next();
                        cur = {t:curTokenStr,type:'punc',r:input.row()};
                    }
                }else if(isNum()){
                    cur = {t:readNum(),type:'num',r:input.row()};
                }
            }else if(input.peek()==='<'){
                isMarkClosed = false;
                cur = {t:input.next(),type:'punc',r:input.row()};
            }else{
                cur = {t:input.nextTextNode(),type:'text',r:input.row()};
            }

        }

        cache[pIndex] = cur;
        clear&&(curIndex=pIndex+1);
        clear&&clearCache(pIndex);
        return cur;
    }

    function peek(){
        return jumpPeek(0);
    }

    function jumpPeek(off){
        var t  = {},oIndex = curIndex;
        for(var i = 0;i<=off;i++){
            t = read(false,oIndex+i);
        }
        return t;
    }

    function clearCache(d){
        for(var i in cache){
            if(d>(+i)){
                delete cache[i];
            }
        }
    }

    //返回当前值，游标移到下一个位置
    function next(){
        return jump(0);
    }

    function jump(off){
        var t  = {}, oIndex = curIndex;
        for(var i = 0;i<=off;i++){
            t = read(true,oIndex+i);
        }
        return t;
    }

    return {
        peek:peek,
        next:next,
        jump:jump,
        jumpPeek:jumpPeek,
        eof:function(){
            return input.eof();
        }
    };
}


function testTokenzer(code){
    var d = new Date();
    var tk = Tokenizer(inputStream(code))
    while(!tk.eof()){
        console.log(tk.next());
    }
    console.log(new Date().getTime()-d.getTime());
}