const { aiActionService, taskService } = require('./lib/services-sqlite');

async function checkActivity() {
  try {
    console.log('=== Checking AI Actions ===');
    const actions = await aiActionService.getAllAIActions(10);
    console.log('Found', actions.length, 'AI actions');
    
    actions.forEach(action => {
      console.log(`- ${action.intentType}: ${action.status} - ${action.intentText?.substring(0, 50)}...`);
    });

    console.log('\n=== Checking Tasks ===');
    const tasks = await taskService.getAllTasks();
    console.log('Found', tasks.length, 'tasks');
    
    tasks.forEach(task => {
      console.log(`- ${task.intentType}: ${task.status} - ${task.title?.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkActivity();
