using System;

namespace ToursApi.Exceptions;

public class MongoDatabaseUnavailableException : Exception
{
    public string DatabaseName { get; }
    public string WebsiteId { get; }

    public MongoDatabaseUnavailableException(string databaseName, string websiteId, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        DatabaseName = databaseName;
        WebsiteId = websiteId;
    }
}
