---
title: 'Database Friendly UUIDs'
date: '2024-07-08T12:04:14+08:00'
draft: true
tags: [ 'database', 'uuid', 'guid', 'dotnet', 'linq' ]
---

## Introduction

UUIDs or GUIDs (as Microsoft calls them) are a common way to generate unique identifiers in software. They are used in many different scenarios, such as primary keys in databases, session identifiers, and more.

The default implementation that most developers are familiar with is [UUIDv4](https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-4) which is essentially a random 128-bit number. The randomness of UUIDv4 is what makes it so useful, as it ensures that the probability of generating the same identifier twice is extremely low. However, the randomness of UUIDv4 can have a negative impact on performance when used as a primary key in a database. We also lose the sequential nature of the identifiers, which can be useful for sorting and indexing.

In this post, I will make use an excellent library called [UUIDNext](https://github.com/mareek/UUIDNext) to generate database-friendly UUIDs in .NET that can also be sorted by creation time.

## The problem with random UUIDs

Consider the following sample code written in .NET 8:

```csharp
var people = new List<Person>
{
    new("Alice", 30),
    new("Bob", 25),
    new("Charlie", 35),
    new("Dave", 40),
    new("Eve", 52)
};

foreach (var person in people.OrderBy(p => p.Id))
{
    Console.WriteLine(person);
}

public record Person(string Name, int Age)
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
```

This code creates a list of `Person` records, each with a `Guid` property called `Id`. The `Id` property is initialized with a new UUIDv4 value. The list is then sorted by the `Id` property and printed to the console.

When you run this code, you will see that the list is sorted by the `Id` property, but the order of the records is essentially random. 

```
Person { Name = Charlie, Age = 35, Id = 10a6b428-76b7-4ff3-b222-2cf5f17a631e, CreatedAt = 8/07/2024 4:17:44 AM }
Person { Name = Bob, Age = 25, Id = 5b61a89c-0b0d-45ce-b509-1d0dc268383a, CreatedAt = 8/07/2024 4:17:44 AM }
Person { Name = Eve, Age = 52, Id = 7979ddab-d88a-4edd-b108-a701cd4c8621, CreatedAt = 8/07/2024 4:17:44 AM }
Person { Name = Alice, Age = 30, Id = e0671354-a99f-4af8-a75a-85d71f1b3c88, CreatedAt = 8/07/2024 4:17:44 AM }
Person { Name = Dave, Age = 40, Id = e0c1c234-599f-4e58-bafa-1306709675dc, CreatedAt = 8/07/2024 4:17:44 AM }
```

It would be awesome if we could generate UUIDs that are sequential and can be sorted by creation time. This is where UUIDNext comes in 😎

## The solution

With only minor changes to the code above, we can use UUIDNext to generate database-friendly UUIDs that can be sorted by creation time.
It does this by creating [UUIDv7](https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-7) compliant UUIDs, which are based on the creation time of the UUID.

```csharp
using UUIDNext; // added this using statement

var people = new List<Person>
{
    new("Alice", 30),
    new("Bob", 25),
    new("Charlie", 35),
    new("Dave", 40),
    new("Eve", 52)
};

foreach (var person in people.OrderBy(p => p.Id))
{
    Console.WriteLine(person);
}

public record Person(string Name, int Age)
{
    public Guid Id { get; init; } = Uuid.NewDatabaseFriendly(Database.SQLite); // changed this line
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
```

With the above changes in place, the code will now generate database-friendly UUIDs using the specified database format (SQLite in this stance). When you run the code, you will see that the list is still sorted by the `Id` property, but now the order of the records is sequential in line with the creation time.


```
Person { Name = Alice, Age = 30, Id = 01909097-36d1-71f4-a1e7-ac01e77be6c8, CreatedAt = 8/07/2024 4:25:47 AM }
Person { Name = Bob, Age = 25, Id = 01909097-36d2-73df-9acc-cf624f721b3c, CreatedAt = 8/07/2024 4:25:47 AM }
Person { Name = Charlie, Age = 35, Id = 01909097-36d2-73e0-9031-b290e3892576, CreatedAt = 8/07/2024 4:25:47 AM }
Person { Name = Dave, Age = 40, Id = 01909097-36d2-73e1-b142-56ce29fd4263, CreatedAt = 8/07/2024 4:25:47 AM }
Person { Name = Eve, Age = 52, Id = 01909097-36d2-73e2-aa71-cdfaaedc253e, CreatedAt = 8/07/2024 4:25:47 AM }
```

### Collision probability

The collision probability of UUIDv7 is higher than UUIDv4, but it is still extremely low. The trade-off between randomness and sequentiality is something to consider when choosing a UUID implementation.

## Conclusion

In this post, I have shown you how to generate database-friendly UUIDs in .NET using UUIDNext. This library is a great tool for generating UUIDs that can be sorted by creation time, which is useful when using UUIDs as primary keys in a database.

Thanks to the author of UUIDNext for creating such a useful and open-source library 💖

I hope you find this post useful, and I encourage you to check out the UUIDNext library for yourself.
