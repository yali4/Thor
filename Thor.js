/*

    For JavaScript.

    Copyright (c) 2014, Thor Template Engine

    Yalçın Ceylan <http://www.yalcinceylan.net>
    
    Github : https://github.com/yali4/Thor

    Latest Version : 1.0.04

 */

var Thor = {};

(function(Thor){
    
    var version = '1.0.04',
        notification = true,
        attributes = {},
        templates = {};
    
    var __forEach = [].forEach,
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
    
    Thor.ShowNotification = function()
    {
        notification = true;
    };
    
    Thor.HideNotification = function()
    {
        notification = false;
    };
    
    Thor.SetAttribute = function(key, value)
    {
        if ( key === null || key === undefined ) return ;
    
        if ( key.toString() === '[object Object]' )
            
            for ( var i in key ) attributes[i] = key[i];    
        
        else attributes[key] = value;
    };
    
    Thor.GetAttribute = function(key)
    {
        return attributes[key];
    };
    
    Thor.GetTemplate = function(id)
    {
        var element = document.getElementById(id);
        
        if ( element === null || element === undefined )
            throw new Error('Template ['+id+'] not found.');
        
        if ( element.getAttribute('type') !== 'text/template' )
            throw new TypeError('Template ['+id+'] type not supported!');
            
        return element;
    };
    
    Thor.LoadTemplate = function()
    {
        if ( !arguments.length ) return ;
    
        var args = Array.prototype.slice.call(arguments);
        
        args.forEach(function(id){
        
            var element = Thor.GetTemplate(id);
        
            templates[id] = element.innerHTML;
        
            element.remove();
            
            if ( notification )
                console.info('Template ['+id+'] has been loaded.');        
        
        });
    
    };
    
    Thor.RenderTemplate = function(id, attributes)
    {
        if ( !__hasProp.call(templates, id) )
            throw new Error('Template ['+id+'] not found.');
        
        this.resource = new Thor.Render(id, templates[id], attributes).engine();
        
        return this;
    };
    
    Thor.RenderTemplate.prototype.createParentNode = function(tagName, properties)
    {
        var section = document.createElement(tagName);
        
        section.innerHTML = this.toString();
        
        for ( var i in properties )
            section.setAttribute(i, properties[i]);        
        
        return section;
    };
    
    Thor.RenderTemplate.prototype.toString = function()
    {
        return this.resource;
    };
    
    Thor.RenderTemplate.prototype.append = function(container)
    {
        container.insertAdjacentHTML('beforeend', this.toString());
    };
    
    Thor.RenderTemplate.prototype.prepend = function(container)
    {
        container.insertAdjacentHTML('afterbegin', this.toString());
    };    

    Thor.RenderTemplate.prototype.appendParent = function(container)
    {
        container.insertAdjacentHTML('afterend', this.toString());
    };

    Thor.RenderTemplate.prototype.prependParent = function(container)
    {
        container.insertAdjacentHTML('beforebegin', this.toString());
    };
    
    Thor.ReplaceTemplate = function(id, attributes)
    {
        this.template = Thor.GetTemplate(id);
        
        this.resource = new Thor.Render(id, this.template.innerHTML, attributes).engine();
        
        return this;   
    };
    
    Thor.ReplaceTemplate.prototype.toString = function()
    {
        return this.resource;
    };
    
    Thor.ReplaceTemplate.prototype.replace = function()
    {
        this.template.insertAdjacentHTML('afterend', this.toString());
        this.template.remove();
    };
    
    Thor.ReplaceTemplate.prototype.replaceParentNode = function(tagName, properties)
    {
        var section = document.createElement(tagName);
        
        section.innerHTML = this.toString();
        
        for ( var i in properties )
            section.setAttribute(i, properties[i]);
            
        this.template.parentNode.replaceChild(section, this.template);
    };
    
    Thor.Render = function(id, resource, attributes)
    {
        this.id = id;
        this.resource = resource;
        this.attributes = attributes;
    };
    
    Thor.Render.prototype.engine = function()
    {
        var self = this,
            resource = self.resource;
     
        if ( notification )
            console.info('Template ['+self.id+'] render has been started. Millisecond: ' + new Date().getMilliseconds());   
        
        var beginForeach = this.beginForeach(resource),
            endForeach = this.endForeach(resource);
            
        var ifBlock = this.ifBlock(resource),
            elseBlock = this.elseBlock(resource),
            endBlocks = this.endBlocks(resource);
                                
        var output = ' var compile = "' +resource.replace(/["]/g, '\\"')+ '";';
        
        if ( beginForeach.length !== endForeach.length )
            throw new SyntaxError('foreach syntax error!');
            
        if ( ifBlock.length !== endBlocks.length )
            throw new SyntaxError('if, for or while syntax error!');  
        
        beginForeach.forEach(function(foreach){
        
            var replace = '"; __forEach.call('+foreach.array+', function('+foreach.value+', '+foreach.key+'){ compile += "';
        
            output = output.replace(foreach.pattern, replace);
        
        });
        
        endForeach.forEach(function(endforeach){
            
            output = output.replace(endforeach.pattern, '"; }); compile += "');
        
        });
        
        ifBlock.forEach(function(ifblock){
        
            output = output.replace(ifblock.pattern, '"; '+ifblock.operator+' ('+ifblock.condition+') { compile += "');
        
        });
        
        elseBlock.forEach(function(elseblock){
        
            output = output.replace(endif.pattern, '"; } else { compile += "');
        
        });
        
        endBlocks.forEach(function(endblock){
        
            output = output.replace(endblock.pattern, '"; } compile += "');
        
        });
        
        output = output.replace(/\n/g, '');
        
        output = output.replace(/\{\{\{\s?(.*?)\s?\}\}\}/gm, function(pattern, key){
            
            return '" +self.escapeString('+key+')+ "';
        
        });
        
        output = output.replace(/\{\{\s?(.*?)\s?\}\}/gm, function(pattern, key){
            
            return '" +('+key+')+ "';
        
        });
        
        output = output.replace(/@\s?include\s?\(\s?'(.*?)'\s?,?\s?(.*?)?\s?\)\s?;?/gm, function(pattern, template, attributes){
        
            return '" +(new Thor.RenderTemplate(\''+template+'\', '+attributes+').toString())+ "';
        
        });
                        
        if ( typeof self.attributes === 'string' && self.attributes.length )
            self.attributes = JSON.parse(self.attributes);
       
        if ( self.attributes.toString() === '[object Object]' )
        {
            var variables = __extends(attributes, self.attributes);
            
            for ( var i in variables ) eval('var '+i+' = variables.'+i+';');
        }

        eval(output);
        
        if ( notification )
            console.info('Template ['+self.id+'] render has been completed. Millisecond: ' + new Date().getMilliseconds());
            
        return compile;        
    };
    
    Thor.Render.prototype.beginForeach = function(source)
    {
        var match,
            results = [],
            iterator = /@\s?foreach\s?\(\s?(.*?)\sas\s(.*?)\s?:\s?(.*?)\s?\)\s?;?$/gm;
        
        while ( match = iterator.exec(source) )
        {
            results.push({
                pattern : match[0],
                array : match[1],
                key : match[2],
                value : match[3],
                begin : match.index,
                end : match.index + match[0].length
            })               
        }
        
        return results;
    };
    
    Thor.Render.prototype.endForeach = function(source)
    {
        var match,
            results = [],
            iterator = /@\s?endforeach\s?;?$/gm;
        
        while ( match = iterator.exec(source) )
        {
            results.push({
                pattern : match[0],
                begin : match.index,
                end : match.index + match[0].length
            })               
        }
        
        return results;
    };
     
    Thor.Render.prototype.ifBlock = function(source)
    {
        var match,
            results = [],
            iterator = /@\s?(if|for|while)\s?\(\s?(.*?)\s?\)\s?;?$/gm;
            
        while ( match = iterator.exec(source) )
        {
            results.push({
                pattern : match[0],
                operator : match[1],
                condition : match[2],
                begin : match.index,
                end : match.index + match[0].length
            });
        }
        
        return results;
    };
    
    Thor.Render.prototype.elseBlock = function(source)
    {
        var match,
            results = [],
            iterator = /@\s?else\s?;?$/gm;
        
        while ( match = iterator.exec(source) )
        {
            results.push({
                pattern : match[0],
                begin : match.index,
                end : match.index + match[0].length
            })               
        }
        
        return results;
    };              
    
    Thor.Render.prototype.endBlocks = function(source)
    {
        var match,
            results = [],
            iterator = /@\s?(endif|endfor|endwhile)\s?;?$/gm;
        
        while ( match = iterator.exec(source) )
        {
            results.push({
                pattern : match[0],
                begin : match.index,
                end : match.index + match[0].length
            })               
        }
        
        return results;
    };
    
    Thor.Render.prototype.escapeString = function(string)
    {
        return document.createElement('div').appendChild(
            document.createTextNode(string)
        ).parentNode.innerHTML;
    };
    
    console.info('Thor is running. Version: ' +version);
    console.info('Thanks for using Thor Template Engine.');
        
})(Thor);
