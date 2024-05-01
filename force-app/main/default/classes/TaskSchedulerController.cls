public class TaskSchedulerController {
    
	@AuraEnabled(Cacheable=false)
    public static list<Task_Schedule__c>GetTasks(String q){
        return database.query(q);
    }
    
    /*@AuraEnabled
    public static String InsertTask(String Name, String Category, DateTime DueDate){
        Task_Schedule__c TS = new Task_Schedule__c(Task_Name__c = Name,Category__c = Category,Due_date__c = DueDate);
        try{
            insert TS;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
        return TS.Name;
    }
    
    @AuraEnabled
    public static void UpdateTask(String TaskId,String Name, String Category, DateTime DueDate, Boolean IsComplete){
        Task_Schedule__c TS = new Task_Schedule__c(Id = TaskId,IsCompleted__c = IsComplete,Task_Name__c = Name,Category__c = Category,Due_date__c = DueDate);
        try{
            update TS;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }*/

    @AuraEnabled(Cacheable=True)
    public static list<User> GetUsers(String Email){
        list<User>users = [SELECT Id,Name,Email FROM User WHERE Email =:Email AND IsActive = True];
        return users;
    }

    @AuraEnabled
    public static void ChangeOwner(list<Id>Tlist,Id NewOwner){
        list<Task_Schedule__c>NewTlist = new list<Task_Schedule__c>();
        try {
            for(Id i : Tlist){
                Task_Schedule__c TS = new Task_Schedule__c();
                TS.Id = i;
                TS.OwnerId = NewOwner;
                NewTlist.add(TS);
            }
            update NewTlist;
        } 
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void DeleteTasks(list<Id>Tlist){
        try {
            list<Task_Schedule__c>DeleteTlist = [SELECT Id FROM Task_Schedule__c WHERE Id IN :Tlist];
            delete DeleteTlist;
        } 
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}