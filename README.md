# shadow

**shadow** is a JavaScript library that helps when attempting to implement a Shadow DOM-like interface. Given a root element and a DocumentFragment shadow will observe changes in both and then insert the `<content>` elements in the appropriate place in the template and attach it back on to the root element. The main problem shadow aims to solve is providing a simple interface for Shadow DOM that supports multiple `<content>` elements along with the `select` attribute.

## Usage

Just provide shadow your element and DocumentFragment containing your `<content>` tags, it will take care of the rest. Either can be live bound and shadow will do the right thing to keep them in sync.

```javascript
var element = $('<foo-bar><span class="name">{{name}}</span></foo-bar>');
var template = can.stache('<h1>Hi <content select="name"/>!</h1>')({
	name: "Matthew"		
});

shadow(element, template);
```
