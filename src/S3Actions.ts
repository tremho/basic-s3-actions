/**
 * Support for common S3 actions
 */

import * as IOException from "./IOExceptions"

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsCommand
} from "@aws-sdk/client-s3";

let s3Client:S3Client = new S3Client({region: "us-west-1"});

/**
 * Call before using API functions to set your preferred region
 * (by default region will be us-west-1 if this is not called before using the API functions)
 * 
 * @param region
 */
export function setRegion(region:string) {
    s3Client = new S3Client({region})
}

/**
 * Put text into an S3 object at the given bucket and key
 * @param bucket
 * @param key
 * @param text
 * @param [verify] optional boolean to wait for and verify availability before returning
 */
export async function s3PutText(bucket:string, key:string, text:string, verify?:boolean)
{
    try {
        console.log("Putting to S3", {bucket, key})
        const response = await s3Client.send(
            new PutObjectCommand({Bucket: bucket, Key: key, Body: text})
        );
        const statusCode = response.$metadata.httpStatusCode;
        console.log('Response code from s3 put command is ' + statusCode);

        if (statusCode !== 200) {
            throw new IOException.PutFailed(`s3PutText Failed with statusCode=${statusCode}`)
        }

        if(verify) {
            console.log("verifying...")
            let isError = true
            let maxTries = 5
            while (isError && maxTries-- > 0) {
                try {
                    const resp = await s3GetResponse(bucket, key);
                    isError = resp.$metadata.httpStatusCode !== 200
                } catch (e: any) {
                    isError = true;
                }
            }
        }

    }
    catch(e:any) {
        console.error("S3 Put failed ", {bucket, key})
        console.error(e);
        throw new IOException.PutFailed(`s3PutText Failed on exception: ${e.message}`);
    }
}

/**
 * Put an object as JSON into the given bucket and key
 * @param bucket
 * @param key
 * @param data
 * @param [verify] optional boolean to wait for and verify availability before returning
*/
export async function s3PutObject(bucket:string, key:string, data:any, verify?:boolean)
{
    try {
        const text = serialize(data);
        await s3PutText(bucket, key, text, verify);
    }
    catch(e:any) {
        console.error(e);
        throw new IOException.PutFailed(`s3PutJson Failed on exception: ${e.message}`)
    }
}

/**
 * Return the list of all object keys (ids) contained in this bucket
 * @param bucket
 */
export async function s3ListObjects(bucket:string):Promise<string[]>
{
    try {
        console.log("Listing objects", {bucket})
        const response = await s3Client.send(
            new ListObjectsCommand({Bucket: bucket})
        );
        const statusCode = response.$metadata.httpStatusCode;
        console.log('Response code from s3 list objects command is ' + statusCode);

        if (statusCode !== 200) {
            throw new IOException.ListFailed(`s3ListObjects Failed with statusCode=${statusCode}`)
        }
        const keysOut:string[] = [];
        for(let keyobj of response.Contents ?? []) {
            keysOut.push(keyobj.Key ?? '')
        }
        return keysOut;
    }
    catch(e:any) {
        console.error("S3 List Objects failed ", {bucket})
        console.error(e);
        throw new IOException.PutFailed(`s3PutText Failed on exception: ${e.message}`);
    }}

/**
 * Get a raw s3 response from the bucket and key
 * @param bucket
 * @param key
 */
export async function s3GetResponse(bucket:string, key:string)
{
    try {
        console.log("S3 Get", {bucket, key})
        return await s3Client.send(
            new GetObjectCommand({Bucket:bucket, Key:key})
        )
    }
    catch(e:any) {
        console.error("S3 Get failed ", {bucket, key})
        console.error(e);
        throw new IOException.GetFailed(`s3GetResponse Failed on exception: ${e.message}`)
    }

}

/**
 * Get text contained at the bucket/key
 * @param bucket
 * @param key
 */
export async function s3GetText(bucket:string, key:string):Promise<string>
{
    return s3ResolveResponseObject(await s3GetResponse(bucket, key));
}

/**
 * Get object from the JSON cantained in bucket/key
 * @param bucket
 * @param key
 */
export async function s3GetObject(bucket:string, key:string):Promise<any>
{
    return deserialize(await s3GetText(bucket, key));
}

/**
 * Delete the s3 object at bucket/key
 * @param bucket
 * @param key
 */
export async function s3Delete(bucket:string, key:string)
{
    try {
        console.log("S3 Delete ", {bucket, key})
        const response = await s3Client.send(
            new DeleteObjectCommand( {Bucket: bucket, Key: key})
        )
        const statusCode = response.$metadata.httpStatusCode;
        console.log('Response code from delete command is ' + statusCode);

        if (!statusCode || statusCode < 200 || statusCode >= 300 ) throw new IOException.DeleteFailed(`s3Delete Failed with statusCode=${statusCode}`)
    }
    catch(e:any)
    {
        console.error("S3 Delete failed "+e.message, {bucket, key})
        console.error(e);
        throw new IOException.DeleteFailed(`s3Delete Failed on exception: ${e.message}`)
    }
}

/**
 * Serialize object to json, or throw serialization exception
 * @param json
 */
export function serialize(json:any):string {
    try {
        // console.log("serialize: stringify this object ", json)
        const text = JSON.stringify(json);
        // console.log("serialized to this text: "+text);
        return text
    }
    catch(e) {
        throw new IOException.SerializationFailed();
    }
}

/**
 * Deserialize json to object or throw Deserialization exception
 * @param text
 */
export function deserialize(text:string):object {
    try {
        if(typeof text === "object") {
            // console.log("already deserialized!")
            return text;
        }
        // console.log("deserialize: parsing this text to an object "+text);
        return JSON.parse(text);
    }
    catch(e) {
        console.error("Failed to deserialize from this text" +text)
        console.error(e);
        throw new IOException.DeserializationFailed();
    }
}

const streamToString = (stream:any):Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks:any[] = [];
        stream.on("data", (chunk:any) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });

/**
 * Resolve a raw response to JSON or string
 * @param response
 */
export async function s3ResolveResponseObject(response:any) {
    let data
    const body = response && response.Body
    if(body) {
        const str:string = await streamToString(body)
        if(str) {
            try {
                data = JSON.parse(str)
            } catch(e) {data = str} // if it's not json
        }
        return data
    }
}
