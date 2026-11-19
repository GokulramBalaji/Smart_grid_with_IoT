// 3-phase Energy Monitor Enclosure
// 3 x PZEM-004T V3.0 + ESP32 DevKit V1 + AC-DC 5V PSU
// Units: mm. Designed as a preliminary parametric enclosure.
// Print base and caps separately.

$fn=48;

// ---------- MASTER DIMENSIONS ----------
W=270; D=120; H=62;
wall=3.2; floor=3.2;
cornerR=8;

// Assumed component envelopes
PZ_L=78; PZ_W=37; PZ_H=19;
ESP_L=55; ESP_W=28; ESP_H=13;

// Layout
pzem_y=12;
pzem_x=[12,96,180];
low_y=67;
barrier_x=8; // mains compartment at right end
mains_x=244;
mains_w=18; // widened only for isolation wall / cable path

// ---------- HELPERS ----------
module rounded_box(x,y,z,r=cornerR){
    hull(){
        translate([r,r,0]) cylinder(h=z,r=r);
        translate([x-r,r,0]) cylinder(h=z,r=r);
        translate([r,y-r,0]) cylinder(h=z,r=r);
        translate([x-r,y-r,0]) cylinder(h=z,r=r);
    }
}

module screw_boss(x,y,h=16,od=10,id=3.4){
    difference(){
        cylinder(h=h,r=od/2);
        translate([0,0,-0.1]) cylinder(h=h+0.2,r=id/2);
    }
}

// ---------- BASE ----------
module base(){
    difference(){
        union(){
            // Main shell
            difference(){
                rounded_box(W,D,H,cornerR);
                translate([wall,wall,floor])
                    rounded_box(W-2*wall,D-2*wall,H,cornerR-wall);
            }

            // Four corner screw towers
            for (p=[[8,8],[W-8,8],[8,D-8],[W-8,D-8]])
                translate([p[0],p[1],floor]) screw_boss(0,0,H-floor-6,10,3.5);

            // Divider between low voltage and mains bay
            translate([238,wall,floor]) cube([4,D-2*wall,H-floor-4]);

            // PZEM guide rails / snap retention, one pair per module
            for(x=pzem_x){
                translate([x,pzem_y-2,floor]) cube([PZ_L,2.4,9]);
                translate([x,pzem_y+PZ_W-0.4,floor]) cube([PZ_L,2.4,9]);
                // End stops
                translate([x-2,pzem_y,floor]) cube([2.4,PZ_W,9]);
                translate([x+PZ_L-0.4,pzem_y,floor]) cube([2.4,PZ_W,9]);
            }

            // Flexible snap fingers on the outside edge of each PZEM pocket
            for(x=pzem_x){
                translate([x+18,pzem_y+PZ_W-0.5,floor+2]) cube([3,5,13]);
                translate([x+57,pzem_y+PZ_W-0.5,floor+2]) cube([3,5,13]);
            }

            // ESP32 guide rails and end stops
            translate([15,low_y,floor]) cube([ESP_L,2.5,8]);
            translate([15,low_y+ESP_W-2.5,floor]) cube([ESP_L,2.5,8]);
            translate([12,low_y,floor]) cube([3,ESP_W,8]);
            translate([15+ESP_L,low_y,floor]) cube([3,ESP_W,8]);

            // PSU mounting rails in isolated mains compartment
            translate([188,low_y,floor]) cube([42,3,8]);
            translate([188,low_y+42-3,floor]) cube([42,3,8]);
            translate([188,low_y,floor]) cube([3,42,8]);
            translate([227,low_y,floor]) cube([3,42,8]);
        }

        // Vent slots: low-voltage side
        for(y=[8:10:48])
            translate([252,y,35]) rotate([0,90,0]) rounded_box(18,3,3,1.2);

        // Vent slots: left side
        for(y=[18:10:55])
            translate([-0.1,y,28]) rotate([0,90,0]) rounded_box(18,3,3,1.2);

        // Front cable-entry slots (low voltage)
        for(x=[12,35,96,119,180,203])
            translate([x,-0.1,14]) cube([14,4,10]);

        // AC cable opening on mains side
        translate([247,-0.1,12]) cube([17,5,15]);

        // Rear connector openings for PZEM/RS485 wiring
        for(x=[20,104,188])
            translate([x,D-0.1,18]) cube([55,5,13]);

        // USB access for ESP32
        translate([12,D-0.1,10]) cube([18,5,13]);

        // Screw holes through corner towers
        for(p=[[8,8],[W-8,8],[8,D-8],[W-8,D-8]])
            translate([p[0],p[1],-0.2]) cylinder(h=H+1,r=3.5/2);
    }
}

// ---------- MAIN CAP / TOP COVER ----------
module main_cap(){
    cap_t=4;
    lip_h=6;
    clearance=0.55;
    union(){
        // Top plate
        difference(){
            rounded_box(W,D,cap_t,cornerR);
            // ventilation grille above PZEMs
            for(x=pzem_x)
                for(y=[8,14,20,26,32,38])
                    translate([x+8,y,-0.1]) cube([60,2.2,cap_t+0.2]);
            // ESP32 ventilation
            for(x=[15,23,31,39,47,55])
                translate([x,71,-0.1]) cube([2.2,18,cap_t+0.2]);
        }

        // Inset locating lip
        difference(){
            translate([wall+clearance,wall+clearance,-lip_h])
                difference(){
                    rounded_box(W-2*(wall+clearance),D-2*(wall+clearance),lip_h,cornerR-wall);
                    translate([wall,wall,-0.1])
                        rounded_box(W-2*(wall+clearance+wall),D-2*(wall+clearance+wall),lip_h+0.2,cornerR-2*wall);
                }
            // remove center so only rim remains
        }

        // Snap hooks along long sides
        for(x=[45,125,205]){
            translate([x,2, -lip_h-3]) cube([10,4,6]);
            translate([x,D-6, -lip_h-3]) cube([10,4,6]);
        }
    }

    // Screw holes in cap, aligned to base towers
    difference(){
        // noop geometry placeholder
    }
}

// Separate screw-hole cut version of cap
module cap_with_holes(){
    difference(){
        main_cap();
        for(p=[[8,8],[W-8,8],[8,D-8],[W-8,D-8]])
            translate([p[0],p[1],-10]) cylinder(h=20,r=2.0);
        // front identification recess
        translate([100,100,-0.2]) cube([70,12,1.2]);
    }
}

// ---------- PSU SAFETY CAP ----------
// Small removable cap for the AC-DC PSU bay. Intended to prevent accidental contact.
module psu_cap(){
    px=184; py=63; pw=50; pd=48; pt=3.5;
    difference(){
        union(){
            translate([px,py,0]) cube([pw,pd,pt]);
            // four locating legs
            for(p=[[px+3,py+3],[px+pw-3,py+3],[px+3,py+pd-3],[px+pw-3,py+pd-3]])
                translate([p[0],p[1],-5]) cube([2.8,2.8,5]);
        }
        // ventilation openings
        for(x=[px+7:px+40])
            translate([x,py+8,-0.1]) cube([2,pd-16,pt+0.2]);
    }
}

// ---------- PRINT PART SELECTOR ----------
// 1 = base, 2 = main cap, 3 = PSU safety cap
part=1;
if(part==1) base();
if(part==2) cap_with_holes();
if(part==3) psu_cap();
