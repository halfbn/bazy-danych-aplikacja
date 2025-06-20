from django.db import models

class Users(models.Model):
    UserID = models.AutoField(primary_key=True)
    Name = models.CharField(max_length=255)
    Surname = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.Name} {self.Surname}"

class AccessGroups(models.Model):
    AccessGroupID = models.AutoField(primary_key=True)
    GroupName = models.CharField(max_length=255)

    def __str__(self):
        return self.GroupName

class Rooms(models.Model):
    RoomID = models.AutoField(primary_key=True)
    Availability = models.IntegerField()  # 0 = zajęty, 1 = dostępny

    def __str__(self):
        return f"Pokój {self.RoomID}"

class RoomAccess(models.Model):
    RoomAccessID = models.AutoField(primary_key=True)
    AccessGroupID = models.ForeignKey(AccessGroups, on_delete=models.CASCADE)
    RoomID = models.ForeignKey(Rooms, on_delete=models.CASCADE)

class UserAccess(models.Model):
    UserAccessID = models.AutoField(primary_key=True)
    AccessGroupID = models.ForeignKey(AccessGroups, on_delete=models.CASCADE)
    UserID = models.ForeignKey(Users, on_delete=models.CASCADE)

class Reservations(models.Model):
    ReservationID = models.AutoField(primary_key=True)
    UserID = models.ForeignKey(Users, on_delete=models.CASCADE)
    RoomID = models.ForeignKey(Rooms, on_delete=models.CASCADE)
    ReservationDate = models.DateField()
    ReservationHour = models.TimeField()
    ExitHour = models.TimeField()
