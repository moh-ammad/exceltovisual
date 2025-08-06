import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const todoSchema=new Schema({
    text:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    },
})

const taskSchema=new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        },
    priority:{
        type:String,
        enum:['low','medium','high'],
        default:'medium'
    },
    status:{
        type:String,
        enum:['pending','in-progress','completed'],
        default:'pending'
    },
    dueDate:{
        type:Date,
        required:true
    },
    assignedTo:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    attachments:[{
        type:String,
        }],
    todoChecklist:[todoSchema],
    progress:{
        type:Number,
        default:0,
        min:0,
        max:100
    }
},
{
    timestamps:true
}
)

const Task=model('Task',taskSchema);
export default Task;