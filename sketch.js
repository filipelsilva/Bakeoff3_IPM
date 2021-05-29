// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 42;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

let draw_Options = false;
let drawSymbs = false;
let drawABC = false;
let drawDEF = false;
let drawGHI = false;
let drawJKL = false;
let drawMNO = false;
let drawPQRS = false;
let drawTUV = false;
let drawWXYZ = false;

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let current_letter = 'a';      // current char being displayed on our basic 2D keyboard (starts with 'a')

//common words and spell-errors
let common = [];
let spell_errors = [];

//currently and past typed word
let current_word = "";
let past_word = "";
let suggestions = [];

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");
  
  // Loads common words and spell-errors
  common = loadStrings("data/count_1w.txt");
  common2w = loadStrings("data/count_2w.txt");
  spell_errors = loadStrings("data/spell-errors.txt");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  drawUserIDScreen();       // draws the user input screen (student number and display si)
  
  for (let i = 0; i < common.length; i++){
    let word = common[i];
    common[i] = word.trim();
  }

  for (let i = 0; i < common2w.length; i++){
    let word = common2w[i];
    common2w[i] = [word.split(" ")[0], word.split(" ")[1]];
  }
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER); 
    textFont("Arial", 12);
    fill(0);
    
    //finds suggestion for current word
    current_word = currently_typed.split(" ")[currently_typed.split(" ").length-1];
    past_word = currently_typed.split(" ")[currently_typed.split(" ").length-2];
    suggestions = auto_complete(currently_typed.split(" ").length, past_word, current_word);
    fill(0, 255, 0);
    text(suggestions[0], width/2 - 2.0*PPCM, height/2 - 1.7*PPCM, 2*PPCM, 1*PPCM);
    stroke(255, 255, 255);
    line(width/2, height/2 - 2*PPCM, width/2, height/2 - PPCM);
    noStroke();
    fill(255, 132, 0);
    text(suggestions[1], width/2 + 0*PPCM, height/2 - 1.7*PPCM, 2*PPCM, 1*PPCM);
    textFont("Arial", 16);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 0, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);

    if(!draw_Options){
      //draw2Dkeyboard();       // draws our basic 2D keyboard UI
      draw2Dkeyboard_v2();
    }
    else{
      drawOptions();
    }

    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

function draw2Dkeyboard_v2()
{
  draw_grid();
  
  draw_letters();
}

function draw_letters()
{
  textAlign(CENTER);
  textFont("Arial", 15);
  fill(0);
  
  fill(0, 255, 0);
  stroke(0, 255, 0);
  text("↑", width/2 - (1.55)*PPCM, height/2 - 1.2*(PPCM/2));
  fill(255, 132, 0);
  stroke(255, 132, 0);
  text("↑", width/2 - (1.1)*PPCM, height/2 - 1.2*(PPCM/2));
  fill(0);
  stroke(0, 0, 0);
  text("⎵", width/2 - (1.55)*PPCM, height/2 - 0.6*(PPCM/2));
  text("←", width/2 - (1.1)*PPCM, height/2 - 0.3*(PPCM/2));
  
  text("a b c", width/2, height/2 - (PPCM/2) + 5);
  
  text("d e f", width/2 + (4/3)*PPCM, height/2 - (PPCM/2) + 5);
  
  text("g h i", width/2 - (4/3)*PPCM, height/2 + PPCM/2 + 5);
  
  text("j k l", width/2 , height/2 + PPCM/2 + 5);
  
  text("m n o", width/2 + (4/3)*PPCM, height/2 + PPCM/2 + 5);

  text("p q r s", width/2 - (4/3)*PPCM, height/2 + (3*PPCM)/2 + 5);

  text("t u v", width/2 , height/2 + (3*PPCM)/2 + 5);

  text("w x y z", width/2 + (4/3)*PPCM, height/2 + (3*PPCM)/2 + 5);
}

function draw_grid(){
  line(width/2 - (2/3)*PPCM, height/2- PPCM, width/2 - (2/3)*PPCM, height/2 + 2*PPCM);
  line(width/2 + (2/3)*PPCM, height/2- PPCM, width/2 + (2/3)*PPCM, height/2 + 2*PPCM);
  
  line(width/2 - 2.0*PPCM, height/2 , width/2 + 2.0*PPCM, height/2);
  line(width/2 - 2.0*PPCM, height/2 + PPCM , width/2 + 2.0*PPCM, height/2 + PPCM);
}

// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{
  // Writes the current letter
  textFont("Arial", 24);
  fill(0);
  text("" + current_letter, width/2, height/2); 
  
  // Draws and the left and right arrow buttons
  noFill();
  imageMode(CORNER);
  image(leftArrow, width/2 - ARROW_SIZE, height/2, ARROW_SIZE, ARROW_SIZE);
  image(rightArrow, width/2, height/2, ARROW_SIZE, ARROW_SIZE);  
}

function drawKeyGrid(){
    line(width/2 - PPCM, height/2- PPCM, width/2 - PPCM, height/2 + 2*PPCM);
    line(width/2 + PPCM/2, height/2- PPCM, width/2 + PPCM/2, height/2 + 2*PPCM); 
    line(width/2 - 2*PPCM, height/2 + PPCM/2, width/2 + 2*PPCM, height/2 + PPCM/2);
}

function drawSymbolsGrid(){
    line(width/2 , height/2 - PPCM, width/2, height/2 + 0.5*PPCM);
    line(width/2 - PPCM, height/2 + 0.5*PPCM, width/2 - PPCM, height/2 + 2*PPCM);
    line(width/2 + PPCM/2, height/2 + 0.5*PPCM, width/2 + PPCM/2, height/2 + 2*PPCM);
    line(width/2 - 2*PPCM, height/2 + PPCM/2, width/2 + 2*PPCM, height/2 + PPCM/2);
}

function drawOptions()
{
  
  textAlign(CENTER);
  textFont("Arial", 25);
  fill(0);
  
  
  if(drawSymbs)
  {
    drawSymbolsGrid();
    //text("✓", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 7);
    text("X", width/2 - (3*PPCM)/2, height/2 + 1.5*PPCM);
    fill(0, 255, 0);
    stroke(0, 255, 0);
    text("↑", width/2 - 1 * PPCM, height/2 - (PPCM/4) + 7);
    fill(255, 132, 0);
    stroke(255, 132, 0);
    text("↑", width/2 + 1 * PPCM, height/2 - (PPCM/4) + 7);
    fill(0);
    stroke(0, 0, 0);
    text("←", width/2 + (5/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);
    text("⎵", width/2 - (1/4)*PPCM, height/2 + (5*PPCM)/4);
  }
  else if(drawABC)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("a", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("b", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("c", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);      
  }
  else if(drawDEF)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("d", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("e", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("f", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);    
  }
  else if(drawGHI)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("g", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("h", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("i", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);    
  }
  else if(drawJKL)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("j", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("k", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("l", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);    
  }
  else if(drawMNO)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("m", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("n", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("o", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);    
  }
  else if(drawPQRS)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("p", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("q", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("r", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5); 
    text("s", width/2 + (5/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);
  }
  else if(drawTUV)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("t", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("u", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("v", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);    
  }
  else if(drawWXYZ)
  {
    drawKeyGrid();
    text("X", width/2 - (3*PPCM)/2, height/2 - PPCM/4 + 8.5);
    text("w", width/2 - (1/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("x", width/2 + (5/4)*PPCM, height/2 - (PPCM/4) + 8.5);
    text("y", width/2 - (1/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5); 
    text("z", width/2 + (5/4)*PPCM, height/2 + ((5*PPCM)/4) + 8.5);
  }
}

// Evoked when the mouse button was pressed
function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    {
      if(!draw_Options)
      {
        if(mouseClickWithin(width/2 - 2*PPCM, height/2 - PPCM, (4*PPCM)/3, PPCM))
          drawSymbs = true;
        
        else if( mouseClickWithin(width/2 - (2/3)*PPCM, height/2 - PPCM, (4*PPCM)/3, PPCM))
          drawABC = true;
        
        else if(mouseClickWithin(width/2 + (2/3)*PPCM, height/2 - PPCM, (4*PPCM)/3, PPCM))
          drawDEF = true;

        else if(mouseClickWithin(width/2 - 2*PPCM, height/2 , (4*PPCM)/3, PPCM))
          drawGHI = true;
        
        else if(mouseClickWithin(width/2 - (2/3)*PPCM, height/2 , (4*PPCM)/3, PPCM))
          drawJKL = true;

        else if(mouseClickWithin(width/2 + (2/3)*PPCM, height/2 , (4*PPCM)/3, PPCM))
          drawMNO = true;

        else if(mouseClickWithin(width/2 - 2*PPCM, height/2 + PPCM, (4*PPCM)/3, PPCM))
          drawPQRS = true;

        else if(mouseClickWithin(width/2 - (2/3)*PPCM, height/2 + PPCM, (4*PPCM)/3, PPCM))
          drawTUV = true;
        
        else if(mouseClickWithin(width/2 + (2/3)*PPCM, height/2 + PPCM, (4*PPCM)/3, PPCM))
          drawWXYZ = true;
        
        draw_Options = true;

          /*else if (current_letter == '`' && currently_typed.length > 0)               // if `, treat that as delete
            currently_typed = currently_typed.substring(0, currently_typed.length - 1);
  */
      }
      else
      {
        if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))
        {
          if(drawSymbs)
          {
            if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed = currently_typed.substring(0, currently_typed.length - 1);
            else if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 2*PPCM, 1.5*PPCM))
            {
              let current_arr = currently_typed.split(' ');
              current_arr[current_arr.length-1] = suggestions[0];
              currently_typed = current_arr.join(' ')+" "; 
            }
            else if(mouseClickWithin(width/2, height/2 - 1.0*PPCM, 2*PPCM, 1.5*PPCM))
            {
              let current_arr = currently_typed.split(' ');
              current_arr[current_arr.length-1] = suggestions[1];
              currently_typed = current_arr.join(' ')+" "; 
            }
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += ' ';        
          }
          else if(drawABC)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'a';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'b';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'c';
          }
          else if(drawDEF)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'd';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'e';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'f';         
          }
          else if(drawGHI)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'g';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'h';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'i';         
          }
          else if(drawJKL)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'j';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'k';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'l';         
          }
          else if(drawMNO)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'm';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'n';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'o';         
          }
          else if(drawPQRS)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'p';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'q';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'r';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 's'; 
          }
          else if(drawTUV)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 't';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'u';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'v';         
          }
          else if(drawWXYZ)
          {
            if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'w';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 - PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'x';
            else if(mouseClickWithin(width/2 - PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'y';
            else if(mouseClickWithin(width/2 + (1/2)*PPCM, height/2 + (1/2)*PPCM, (3/2)*PPCM, (3/2)*PPCM))
              currently_typed += 'z';           
          }
          
            draw_Options = false;
            drawSymbs = false;
            drawABC = false;
            drawDEF = false;
            drawGHI = false;
            drawJKL = false;
            drawMNO = false;
            drawPQRS = false;
            drawTUV = false;
            drawWXYZ = false;
        }
      }
    }
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();

      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];  
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

function auto_complete(len, past_word, current_word){
  if (len <= 1)
    return auto_complete1w(current_word.trim());
  else
    return auto_complete2w(past_word.trim(), current_word.trim());
}

function auto_complete1w(word){
  let len = word.length;
  let suggestion_1, suggestion_2;
  let last_i = 1;
  for (let i = 0; i < common.length; i++){
    let suggestion = common[i];
    if (word === suggestion.substring(0,len) && word !== suggestion && suggestion.length < 14){
      suggestion_1 = suggestion;
      last_i = i+1;
      break;
    }
  }
  
  for (let i = last_i; i < common.length; i++){
    let suggestion = common[i];
    if (word === suggestion.substring(0,len) && word !== suggestion && suggestion.length < 14){
      suggestion_2 = suggestion;
      return [suggestion_1, suggestion_2];
    }
  }
  
  return [common[0],common[1]];
}

function auto_complete2w(past_word, current_word){
  let len = current_word.length;
  let suggestion_1, suggestion_2;
  let last_i = 1;
  for (let i = 0; i < common2w.length; i++){
    if (past_word == common2w[i][0]){
      let suggestion = common2w[i][1];
      if (current_word === suggestion.substring(0,len) && current_word !== suggestion && suggestion.length < 14){
        suggestion_1 = suggestion;
        last_i = i+1;
        break;
      }
    }
  }
  
  for (let i = last_i; i < common2w.length; i++){
    if (past_word == common2w[i][0]){
      let suggestion = common2w[i][1];
      if (current_word === suggestion.substring(0,len) && current_word !== suggestion && suggestion.length < 14){
        suggestion_2 = suggestion;
        return [suggestion_1, suggestion_2];
      }
    }
  }
  
  return auto_complete1w(current_word);
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  current_letter       = 'a';
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  CPS = letters_entered / attempt_duration / 60;
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);
  text("CPS: " + CPS.toFixed(2), width / 2, height / 2 + h+100);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
  
  ARROW_SIZE    = (int)(2.2 * PPCM);
  
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}
