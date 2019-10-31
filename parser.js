
///var code = 'function test(){ x=a.b+b/4.55552.3;console.log(\'this is just a test!\');}';
function Parser(tokenizer){
    var tk = tokenizer;


    var gStack = [];

    function parseAttr(){
        var n = tk.peek();
        if(n.type==='id'||n.type==='keyword'){
            var setOp = tk.jumpPeek(1);
            if(setOp.t==='='){
                var v = tk.jumpPeek(2);
                if(v.type==='id'||v.type=='num'||v.type==='string'){
                    tk.jump(2);
                    return {name:n.t,value:v.t};
                }else{
                    throw Error("the attr value is not right at row "+v.r +" "+v.t);
                }
            }else{
                tk.next();
                return {name:n.t};
            }
        }else{
            throw Error("the attr name is not right at row "+n.r +" "+n.t);
        }
    }

    function parseExpress(){

    }

    function parseAttrs(){
        var cur = tk.peek(),res = [];
        while(!tk.eof()&&cur.t!=='>'&&cur.t!=='/'){
            res.push(parseAttr());
            cur = tk.peek();
        }
        console.log(res);
        return res;
    }

    function jumpTKs(a){
        var t ,ac=0;
        for(var i=0;i<a.length;i++){
            t = tk.peek();
            if(t.t===a[i]){
                tk.next();
                ac++;
            }
        }
        return ac;
    }

    function parseStartTag(){
        var t1 = tk.peek(),
            t2 = tk.jumpPeek(1);
        if(t1.t==='<'&&t2.type==='id'){
            tk.jump(1);
            var attrs = parseAttrs(),
                closed = jumpTKs(['/','>'])===2;
            gStack.push({type:'tag',tagName:t2.t,attrs:attrs,closed:closed});
            return gStack[gStack.length-1];
        }else{
            throw new Error("this is not the start tag row:",t1.r);
        }
    }

    function closeTag(tagName){
        var cs= [];
        for(var l=gStack.length-1;l>=0;l--){
            var cur = gStack[l];
            if(cur.type==='tag'&&!cur.closed&&cur.tagName===tagName){
                cur.closed = true;
                if(cs.length){
                    cur.children = cs.reverse();
                }
                gStack.length = l+1;
                break;
            }else{
                cs.push(cur);
            }
        }
    }

    function parseEndTag(){
        var cs = [],
            t1 = tk.peek(),
            t2 = tk.jumpPeek(1);
        if(t1.t==='<'&&t2.t==='/'){
            tk.jump(1);
            var id = tk.peek();
            if(id.type!=='id'){
                throw new Error("there needs a end tag name  row:"+t1.r);
            }else{
                var markClose = tk.jumpPeek(1);
                if(markClose.t==='>'){
                    closeTag(id.t);
                    tk.jump(1);
                }else{
                    throw new Error("there needs a end tag mark >  row:"+t1.r);
                }
            }
        }else{
            throw new Error("this is not the end tag row:",t1.r);
        }

    }

    function parseTextNode(){
        gStack.push({type:'text',content:tk.next().t});
    }


    function parseNode(){
        var t1 = tk.peek();
        if(t1.t==='<'){
            var t2 = tk.jumpPeek(1);
            if(t2.type==='id'){
                parseStartTag();
            }else if(t2.type==='punc'&&t2.t==='/'){
                parseEndTag();
            }else if(t2.t==='!'&&jumpPeekRange(2,3)==='--'){
                jumpNotation();
            }
        }else{
            parseTextNode();
        }
    }

    function jumpNotation(){
        tk.jump(3);
        var depth = 1;
        while(!tk.eof()){
            var t1 = tk.peek();
            if(t1.t==='<'){
                var t2 = tk.jumpPeek(1);
                if(t2.t==='!'){
                    if(jumpPeekRange(2,3)==='--'){
                        depth++;
                        tk.jump(3);
                    }else{
                        tk.next();
                    }
                }else{
                    tk.next();
                }
            }else if(t1.t==='-'){
                if(jumpPeekRange(1,2).t === '->'){
                    depth--;
                    tk.jump(2);
                }else{
                    tk.next();
                }
            }else{
                tk.next();
            }
            if(depth===0){
                break;
            }
        }
    }

    function jumpPeekRange(s,e){
        var res = [];
        for(var i = s;i<=e;i++){
            res.push(tk.jumpPeek(2).t);
        }
        return res.join('');
    }

    function parse(){
        gStack = [];
        while(!tk.eof()){
            parseNode();
        }
        console.log(gStack);
        console.log(JSON.stringify(gStack));
    }

    return parse;
}

function testParse(code){
    var d = new Date();
    var tk = Tokenizer(inputStream(code));
    var parse = Parser(tk);
    parse();
    console.log(new Date().getTime()-d.getTime());
}