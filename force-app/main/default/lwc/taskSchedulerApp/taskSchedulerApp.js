import { LightningElement,track } from 'lwc';
import GetTasks from '@salesforce/apex/TaskSchedulerController.GetTasks';
import GetUsers from '@salesforce/apex/TaskSchedulerController.GetUsers';
import ChangeOwner from '@salesforce/apex/TaskSchedulerController.ChangeOwner';
import DeleteTasks from '@salesforce/apex/TaskSchedulerController.DeleteTasks';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
export default class TaskSchedulerApp extends NavigationMixin(LightningElement){
    @track ActiveTab;
    @track query;mainquery ='SELECT Name,Task_Name__c,Category__c,IsCompleted__c,Due_date__c,Owner.Name FROM Task_Schedule__c';subquery;
    @track data;
    @track isShowModal = false;
    @track users = [];
    @track selectedRecords=[];
    spin = false;
    TableSize = 12;FormSize = 0;
    @track RecId;
    
    //comp visibility variables
    TaskView = false;TaskEdit = false;TaskFilter=false;TaskNew = false;
    
    columns = [
        {
            type: "button", label: 'View', fieldName:'Name', typeAttributes: {
                label:{ fieldName: 'Name' },
                title: 'View',
                name : 'view',
                disabled: false,
                variant:'Base'
            }
        },
        { label: 'Name', fieldName: 'Task_Name__c'},
        { label: 'Category', fieldName: 'Category__c' },
        {label: 'Completed',fieldName: 'IsCompleted__c'},
        {
            label: 'Due Date',
            fieldName: 'Due_date__c',
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            }
        },
        { label: 'Owner', fieldName: 'OwnerName'},
        {
            type: "button", label: 'Edit', initialWidth: 20, typeAttributes: {
                name: 'edit',
                title: 'Edit',
                iconPosition: 'center',
                iconName:'utility:edit',
                variant:'Base'
            }
        }
    ];

    Categories = [{label:'Work',value:'Work'},{label:'Personal',value:'Personal'},{label:'Others',value:'others'}];
    DateOptions = [{label:'Old-to-Latest',value:'Old-to-Latest'},{label:'Latest-to-Old',value:'Latest-to-Old'}];

    handleActive(event) {
        this.query='';
        this.ActiveTab = event.target.value;
        //const query = 'SELECT Name,Task_Name__c,Category__c,IsCompleted__c,Due_date__c,Owner.Name FROM Task_Schedule__c';
        if(this.ActiveTab === '1'){
            this.subquery = ` WHERE Due_date__c >= TODAY AND IsCompleted__c = False`;
        }
        else if(this.ActiveTab === '2'){
            this.subquery = ` WHERE IsCompleted__c = True`;
        }
        else if(this.ActiveTab === '3'){
            this.subquery = ` WHERE Due_date__c < TODAY AND IsCompleted__c = False`;
        }
        this.query = this.mainquery + this.subquery
        console.log(this.query);
        this.RetieveTasks();
    }

    FilterResult(){
        console.log(this.query)
        this.query = ''
        let filterquey;
        const category = this.template.querySelector('.category').value;
        const sortdate =  this.template.querySelector('.sortdate').value;
        console.log(category,sortdate);
        //const query = 'SELECT Name,Task_Name__c,Category__c,IsCompleted__c,Due_date__c,Owner.Name FROM Task_Schedule__c';
        if(category!=undefined && sortdate!=undefined){
            filterquey = sortdate === "Latest-to-Old" ? ` AND Category__c = '${category}' Order By CreatedDate DESC` : ` AND Category__c = '${category}' Order By CreatedDate ASC`;
        }
        else if(category!=undefined && sortdate===undefined){
            filterquey = ` AND Category__c = '${category}'`;
        }
        else if(sortdate!=undefined && category===undefined){
            filterquey = sortdate === "Latest-to-Old" ? ` Order By CreatedDate DESC` : ` Order By CreatedDate ASC`;
        }
        this.query = this.mainquery + this.subquery + filterquey
        console.log(this.query)
        this.RetieveTasks(); 
    }

    ResetFilters(){
        this.query = '';
        this.query = this.mainquery + this.subquery;
        this.RetieveTasks();
    }

    async RetieveTasks(){
        this.spin = true;
       await GetTasks({q:this.query})
        .then(result =>{
            this.data = result.map(row=> {
                return {...row,OwnerName:row.Owner.Name}
            })
            console.log(this.data.length);
        })
        .catch(error =>{
            console.log(error)
        })
        this.spin = false;
    }

    /*navigateToNewTaskScheduler() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Task_Schedule__c',
                actionName: 'new'
            },
        });
    }*/

    ShowToast(title,msg,variant) {
        const event = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    ChangeOwner(){
        this.selectedRecords =  this.template.querySelector("lightning-datatable").getSelectedRows();
        console.log(this.selectedRecords);
        if(this.selectedRecords.length>0){
            this.isShowModal = this.isShowModal == true ? false : true;
        }
        else{
            this.ShowToast('Error','Please select atleast one row.','error');
        }
    }

    async SearchUsers(){
        this.spin = true;
        let e = this.template.querySelector(".userEmail").value;
        await GetUsers({Email:e})
        .then(result =>{
            this.users = result;
            console.log(result.length);
        })
        .catch(error =>{
            console.log(error);
        })
        this.spin = false;
    }

    async SelectNewOwner(event){
        let {uid,uin} = event.target.dataset;
        console.log(uid);
        
        if(uid && uin){
            this.isShowModal = false;
            const result = await LightningConfirm.open({
                message: `Do you really want to change the ownership of ${this.selectedRecords.length} selected record(s) to ${uin}?`,
                variant: 'header',
                label: 'Change Owner',
            });
            if(result){
                let RecIds = [];
                for(let i of this.selectedRecords){
                    RecIds.push(i.Id);
                }
                this.spin = true;
                await ChangeOwner({Tlist:RecIds,NewOwner:uid})
                .then(result =>{
                    console.log(result);
                    this.ShowToast('Success', 'Ownership changed successfully','Success');
                })
                .catch(error => {
                    this.ShowToast('Something went wrong', error.body.message, 'error');
                })
                this.spin = false;
            }
        }
    }

    async DeleteRecs(){
        this.selectedRecords =  this.template.querySelector("lightning-datatable").getSelectedRows();
        if(this.selectedRecords.length>0){
            const result = await LightningConfirm.open({
                message: `Do you really want to delete?`,
                variant: 'header',
                label: 'Delete?',
            });
            if(result){
                let RecIds = [];
                for(let i of this.selectedRecords){
                    RecIds.push(i.Id);
                }
                this.spin = true;
                await DeleteTasks({Tlist:RecIds})
                .then(result =>{
                    console.log(result);
                    this.ShowToast('Success', 'Deleted successfully','Success');
                })
                .catch(error =>{
                    console.log(error.body.message);
                })
                this.spin = false;
            }
        }
        else{
            this.ShowToast('Error','Please select atleast one row.','error');
        }
    }

    HandleFormSuccess(event){
        let TaskId = event.detail.id;
        this.ShowToast('Success',`Action done successfully Id:${TaskId}`,'success');
        let action = event.target.dataset.action;
        if(action==="new"){
            const inputFields = this.template.querySelectorAll('lightning-input-field');
            if (inputFields) {
                inputFields.forEach(field => {
                field.reset();
                });
            }
        }
        else{
            this.TaskView = true;
            this.TaskEdit = false;
        }
    }

    HandleFormError(event){
        let message = event.detail.detail;
        this.ShowToast('Error',message,'error');
    }

    ConfigureCompSize(btn){
        this.TableSize = 8;this.FormSize = 4;
        if(btn!='filter'){
            this.spin = true;
        }
        /*setTimeout(()=>{
            this.spin = false;
        },2000)*/
    }

    FormLoad(){
        this.spin = false;
    }

    HandleCompVisibility(event){
        const btn = event.target.dataset.btnid;
        this.ConfigureCompSize(btn);
        this.TaskNew = btn === 'new' ? true : false;
        this.TaskFilter = btn === 'filter' ? true : false;
        this.TaskView = false;
        this.TaskEdit = false;
        console.log(btn)
    }

    HandleRowAction(event) {
        this.RecId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        this.ConfigureCompSize();
        //View
        if (actionName === 'view') {
            this.TaskView = true;this.TaskEdit = false;this.TaskFilter = false; this.TaskNew = false;
            //console.log('view',recId);
        }
        //Edit
        if (actionName === 'edit') {
            this.TaskEdit = true;this.TaskView = false;this.TaskFilter = false; this.TaskNew = false;
            //console.log('edit',recId);
        }
    }

    CloseForm(){
        this.TableSize = 12;this.FormSize = 0;
    }
}