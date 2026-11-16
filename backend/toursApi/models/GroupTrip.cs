using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ToursApi.Models
{
    [BsonIgnoreExtraElements]
    public class GroupTrip
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [JsonPropertyName("_id")]
        public string? Id { get; set; }

        [BsonElement("websiteId")]
        [JsonPropertyName("websiteId")]
        public string WebsiteId { get; set; } = string.Empty;

        [BsonElement("groupName")]
        [JsonPropertyName("groupName")]
        public string GroupName { get; set; } = string.Empty;

        [BsonElement("destination")]
        [JsonPropertyName("destination")]
        public string Destination { get; set; } = string.Empty;

        [BsonElement("inviteCode")]
        [JsonPropertyName("inviteCode")]
        public string InviteCode { get; set; } = string.Empty;

        [BsonElement("members")]
        [JsonPropertyName("members")]
        public List<GroupMemberDto> Members { get; set; } = new();

        [BsonElement("polls")]
        [JsonPropertyName("polls")]
        public List<GroupPollDto> Polls { get; set; } = new();

        [BsonElement("gearItems")]
        [JsonPropertyName("gearItems")]
        public List<GroupGearItemDto> GearItems { get; set; } = new();

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
