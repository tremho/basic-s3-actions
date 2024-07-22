# basic-s3-actions
Basic s3 operations to create, read, delete and list S3 objects as json or text

This is just a simple set of handy wrappers around basic use of s3 for simple purposes. 
Namely, Javascript objects or text documents.

This package is limited to basic functionality to use s3 for persisting text and objects, as a foundation for creating
higher-level support above it.

This does not directly support file-based upload/download as some other utilities do, although it could be easily used
to create such features.

## USAGE

### Install
`npm i @tremho/basic-s3-actions`

### API

#### Before using:
You will need to have an AWS set up for development and you should have AWS credentials available, typically in a folder named `.aws` in your
home directory.  See Amazon documentation on setting up common credentials for API usage.

You should call the `setRegion` function before using any of the put/get APIs to set your preferred AWS region.
By default, the region is set to 'us-west-1'.

### Import into code
Import into your javascript / Typescript module

```typescript
import {
    setRegion,
    s3PutText,
    s3PutObject,
    s3GetText,
    s3GetObject,
    s3ListObjects,
    s3Delete
} from "./S3Actions";

```

#### initializing / setting a region
```typescript
    setRegion("us-east-1"); // call once before using API to set your preferred region.
```

#### Storing a Javascript object
```typescript
    // You may have some sort of Javascript object
    const myObject = {
        foo: "foolish",
        bar: "barish",
        other: {
            a: "one",
            b: 2
        },
        when: new Date(Date.now).toISOString()
    }
    
    // Save it to an S3 bucket you have created.
    // In this case, the bucket name is "BUCKET_NAME"
    // The object will be saved under the key name "FirstObject".
    await s3PutObject("BUCKET_NAME", "FirstObject", myObject)
    
```

#### Retrieving an Object
```typescript
    // Let's fetch the object we stored in the previous example here
    const myObject = s3GetObject("BUCKET_NAME", "FirstObject")
    console.log(myObject);
```

#### Saving and retrieving text
This is pretty much the same as with objects, but the text can be any text form

```typescript
import {s3GetText, s3PutText} from "./S3Actions";

const someText = "Hello, World. This is some text that is being saved as an example."

// We'll save it to our bucket under the key "TextDoc1"
await s3PutText("BUCKET_NAME", "TextDoc1")

// Now let's read it back
const readText = await s3GetText("BUCKET_NAME", "TextDoc1")
console.log(readText)
console.log(readText === someText)
```

#### Using the optional `verify` parameter
The `s3PutText` and `s3PutObject` commands accept an optional final parameter named 'verify' that when true, 
instructs the code to poll to confirm the accessibility of the recently posted object.  This is normally unnecessary,
but there are situations where a bit of a race condition can occur for certain objects that are saved and then immediately read,
and this can help mitigate that scenario.

#### Listing object keys of a bucket
To get a list of all the keys saved to a given bucket:

```typescript
import {s3ListObjects} from "./S3Actions";

const keys = await s3ListObjects("BUCKET_NAME")
console.log(keys)
```

#### Deleting an object

```typescript
import {s3Delete} from "./S3Actions";

await s3Delete("BUCKET_NAME", "FirstObject")
```
----

[GitHub Repository](https://github.com/tremho/basic-s3-actions)

Releases:
1.0.0 - 7/22/24 - Initial release

