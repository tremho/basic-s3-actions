
/*
Used by S3Actions
 */

// Failed to save
export class PutFailed extends Error
{
    constructor(message:string = "Failed to save") {
        super(message);
    }
}
// Failed to retrieve
export class GetFailed extends Error
{
    constructor(message:string = "Failed to receive") {
        super(message);
    }
}
// Failed to delete
export class DeleteFailed extends Error
{
    constructor(message:string = "Failed to delete") {
        super(message);
    }
}
// Failed to list
export class ListFailed extends Error
{
    constructor(message:string = "Failed to save") {
        super(message);
    }
}
// Failed to serialize (stringify)
export class SerializationFailed extends Error
{
    constructor(message:string = "Failed to serialize") {
        super(message);
    }
}
// Failed to deserialize (parse)
export class DeserializationFailed extends Error
{
    constructor(message:string = "Failed to deserialize") {
        super(message);
    }
}

