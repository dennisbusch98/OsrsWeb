// OSRS drop-rate data, verified against the OSRS Wiki. "rate" fields for
// dt2/standard bosses already represent the EFFECTIVE per-kill probability
// of that specific item (p = 1/rate), so the same number can be fed
// straight into a binomial model in lootsim.js.
const IMG_BASE = 'https://oldschool.runescape.wiki/images/';

const BOSS_DATA = {
  cox: {
    name: "Chambers of Xeric", unitName: "Raids", keyItem: "Twisted bow", type: "cox",
    gear: "Melee/Range/Mage hybrid. Dinh's bulwark for tank, DHCB/lance for Olm, Ancestral for mage rooms.",
    drops: [
      { name: "Dexterous prayer scroll", weight: 20, value: 28000000, img: "Dexterous_prayer_scroll.png" },
      { name: "Arcane prayer scroll", weight: 20, value: 3500000, img: "Arcane_prayer_scroll.png" },
      { name: "Twisted buckler", weight: 4, value: 18000000, img: "Twisted_buckler.png" },
      { name: "Dragon hunter crossbow", weight: 4, value: 62000000, img: "Dragon_hunter_crossbow.png" },
      { name: "Ancestral hat", weight: 3, value: 75000000, img: "Ancestral_hat.png" },
      { name: "Ancestral robe top", weight: 3, value: 170000000, img: "Ancestral_robe_top.png" },
      { name: "Ancestral robe bottom", weight: 3, value: 155000000, img: "Ancestral_robe_bottom.png" },
      { name: "Dinh's bulwark", weight: 3, value: 22000000, img: "Dinh%27s_bulwark.png" },
      { name: "Dragon claws", weight: 3, value: 92000000, img: "Dragon_claws.png" },
      { name: "Elder maul", weight: 2, value: 145000000, img: "Elder_maul.png" },
      { name: "Kodai insignia", weight: 2, value: 130000000, img: "Kodai_insignia.png" },
      { name: "Twisted bow", weight: 2, value: 1650000000, img: "Twisted_bow.png" }
    ]
  },
  toa: {
    name: "Tombs of Amascut", unitName: "Raids", keyItem: "Tumeken's shadow", type: "toa",
    gear: "Ranged/Mage. Masori + Venator bow/Twisted bow, Osmumten's fang for melee phases.",
    drops: [
      { name: "Osmumten's fang", weight: 7, value: 14000000, img: "Osmumten%27s_fang.png" },
      { name: "Lightbearer", weight: 7, value: 3000000, img: "Lightbearer.png" },
      { name: "Elidinis' ward", weight: 3, value: 6000000, img: "Elidinis%27_ward.png" },
      { name: "Masori mask", weight: 2, value: 12000000, img: "Masori_mask.png" },
      { name: "Masori body", weight: 2, value: 55000000, img: "Masori_body.png" },
      { name: "Masori chaps", weight: 2, value: 48000000, img: "Masori_chaps.png" },
      { name: "Tumeken's shadow", weight: 1, value: 1200000000, img: "Tumeken%27s_shadow_%28uncharged%29.png" }
    ]
  },
  vardorvis: {
    name: "Vardorvis", unitName: "Kills", keyItem: "Ultor vestige", type: "dt2", rollRate: 362.66,
    gear: "Melee, slash. Soulreaper axe/Osmumten's fang, Blood fury. Hold Protect Melee oppe hele tiden.",
    drops: [
      { name: "Ultor vestige", rate: 1088, isVestige: true, value: 160000000, img: "Ultor_vestige.png" },
      { name: "Gold ring", rate: 363, isGoldRing: true, value: 210, img: "Gold_ring.png" },
      { name: "Executioner's axe head", rate: 1088, value: 40000000, img: "Executioner%27s_axe_head.png" },
      { name: "Chromium ingot", rate: 363, value: 500000, img: "Chromium_ingot.png" },
      { name: "Virtus mask", rate: 3264, value: 18000000, img: "Virtus_mask.png" },
      { name: "Virtus robe top", rate: 3264, value: 45000000, img: "Virtus_robe_top.png" },
      { name: "Virtus robe bottom", rate: 3264, value: 38000000, img: "Virtus_robe_bottom.png" }
    ]
  },
  duke: {
    name: "Duke Sucellus", unitName: "Kills", keyItem: "Magus vestige", type: "dt2", rollRate: 240,
    gear: "Melee. Torva/Bandos + BGS-spec eller Voidwaker. Slayer helm/gassmaske mot gassventiler.",
    drops: [
      { name: "Magus vestige", rate: 720, isVestige: true, value: 65000000, img: "Magus_vestige.png" },
      { name: "Gold ring", rate: 240, isGoldRing: true, value: 210, img: "Gold_ring.png" },
      { name: "Eye of the duke", rate: 720, value: 35000000, img: "Eye_of_the_duke.png" },
      { name: "Chromium ingot", rate: 240, value: 500000, img: "Chromium_ingot.png" },
      { name: "Virtus mask", rate: 2160, value: 18000000, img: "Virtus_mask.png" },
      { name: "Virtus robe top", rate: 2160, value: 45000000, img: "Virtus_robe_top.png" },
      { name: "Virtus robe bottom", rate: 2160, value: 38000000, img: "Virtus_robe_bottom.png" }
    ]
  },
  whisperer: {
    name: "The Whisperer", unitName: "Kills", keyItem: "Bellator vestige", type: "dt2", rollRate: 170.66,
    gear: "Magic. Shadow/Sanguinesti + Bellator ring. Følg Sanity og løs Shadow Realm raskt.",
    drops: [
      { name: "Bellator vestige", rate: 512, isVestige: true, value: 85000000, img: "Bellator_vestige.png" },
      { name: "Gold ring", rate: 171, isGoldRing: true, value: 210, img: "Gold_ring.png" },
      { name: "Siren's staff", rate: 512, value: 35000000, img: "Siren%27s_staff.png" },
      { name: "Chromium ingot", rate: 171, value: 500000, img: "Chromium_ingot.png" },
      { name: "Virtus mask", rate: 1536, value: 18000000, img: "Virtus_mask.png" },
      { name: "Virtus robe top", rate: 1536, value: 45000000, img: "Virtus_robe_top.png" },
      { name: "Virtus robe bottom", rate: 1536, value: 38000000, img: "Virtus_robe_bottom.png" }
    ]
  },
  leviathan: {
    name: "The Leviathan", unitName: "Kills", keyItem: "Venator vestige", type: "dt2", rollRate: 256,
    gear: "Ranged. Twisted bow/Venator bow. Aggressiv fra spawn - be i bønn før du går inn.",
    drops: [
      { name: "Venator vestige", rate: 768, isVestige: true, value: 50000000, img: "Venator_vestige.png" },
      { name: "Gold ring", rate: 256, isGoldRing: true, value: 210, img: "Gold_ring.png" },
      { name: "Leviathan's lure", rate: 768, value: 35000000, img: "Leviathan%27s_lure.png" },
      { name: "Chromium ingot", rate: 256, value: 500000, img: "Chromium_ingot.png" },
      { name: "Virtus mask", rate: 2304, value: 18000000, img: "Virtus_mask.png" },
      { name: "Virtus robe top", rate: 2304, value: 45000000, img: "Virtus_robe_top.png" },
      { name: "Virtus robe bottom", rate: 2304, value: 38000000, img: "Virtus_robe_bottom.png" }
    ]
  },
  callisto: {
    name: "Callisto", unitName: "Kills", keyItem: "Voidwaker hilt", type: "standard",
    gear: "Ranged/Magic + frys. Multi-combat wildy, ikke bring noe du ikke tåler å miste.",
    drops: [
      { name: "Voidwaker hilt", rate: 360, value: 4000000, img: "Voidwaker_hilt.png" },
      { name: "Claws of callisto", rate: 196, value: 13000000, img: "Claws_of_callisto.png" },
      { name: "Tyrannical ring", rate: 512, value: 6000000, img: "Tyrannical_ring.png" },
      { name: "Dragon pickaxe", rate: 256, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 256, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Callisto cub", rate: 1500, value: 0, img: "Callisto_cub.png" }
    ]
  },
  artio: {
    name: "Artio", unitName: "Kills", keyItem: "Voidwaker hilt", type: "standard",
    gear: "Ranged/Magic + frys. Trygg solo-variant av Callisto (singles-plus).",
    drops: [
      { name: "Voidwaker hilt", rate: 912, value: 4000000, img: "Voidwaker_hilt.png" },
      { name: "Claws of callisto", rate: 618, value: 13000000, img: "Claws_of_callisto.png" },
      { name: "Tyrannical ring", rate: 716, value: 6000000, img: "Tyrannical_ring.png" },
      { name: "Dragon pickaxe", rate: 358, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 358, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Callisto cub", rate: 2800, value: 0, img: "Callisto_cub.png" }
    ]
  },
  venenatis: {
    name: "Venenatis", unitName: "Kills", keyItem: "Voidwaker gem", type: "standard",
    gear: "Melee (crush). Multi-combat wildy. Drep spiderlings umiddelbart.",
    drops: [
      { name: "Voidwaker gem", rate: 360, value: 4000000, img: "Voidwaker_gem.png" },
      { name: "Fangs of venenatis", rate: 196, value: 10000000, img: "Fangs_of_venenatis.png" },
      { name: "Treasonous ring", rate: 512, value: 15000000, img: "Treasonous_ring.png" },
      { name: "Dragon pickaxe", rate: 256, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 256, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Venenatis spiderling", rate: 1500, value: 0, img: "Venenatis_spiderling.png" }
    ]
  },
  spindel: {
    name: "Spindel", unitName: "Kills", keyItem: "Voidwaker gem", type: "standard",
    gear: "Melee (crush). Trygg solo-variant av Venenatis (singles-plus).",
    drops: [
      { name: "Voidwaker gem", rate: 912, value: 4000000, img: "Voidwaker_gem.png" },
      { name: "Fangs of venenatis", rate: 618, value: 10000000, img: "Fangs_of_venenatis.png" },
      { name: "Treasonous ring", rate: 716, value: 15000000, img: "Treasonous_ring.png" },
      { name: "Dragon pickaxe", rate: 358, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 358, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Venenatis spiderling", rate: 2800, value: 0, img: "Venenatis_spiderling.png" }
    ]
  },
  vetion: {
    name: "Vet'ion", unitName: "Kills", keyItem: "Voidwaker blade", type: "standard",
    gear: "Melee (crush) + Salve amulet(e) - han er undead. Multi-combat wildy.",
    drops: [
      { name: "Voidwaker blade", rate: 360, value: 4000000, img: "Voidwaker_blade.png" },
      { name: "Skull of vet'ion", rate: 196, value: 8000000, img: "Skull_of_vet%27ion.png" },
      { name: "Ring of the gods", rate: 512, value: 6000000, img: "Ring_of_the_gods.png" },
      { name: "Dragon pickaxe", rate: 256, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 256, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Vet'ion jr.", rate: 1500, value: 0, img: "Vet%27ion_jr..png" }
    ]
  },
  calvarion: {
    name: "Calvar'ion", unitName: "Kills", keyItem: "Voidwaker blade", type: "standard",
    gear: "Melee (crush) + Salve amulet(e). Trygg solo-variant av Vet'ion. Drep hunder først.",
    drops: [
      { name: "Voidwaker blade", rate: 912, value: 4000000, img: "Voidwaker_blade.png" },
      { name: "Skull of vet'ion", rate: 618, value: 8000000, img: "Skull_of_vet%27ion.png" },
      { name: "Ring of the gods", rate: 716, value: 6000000, img: "Ring_of_the_gods.png" },
      { name: "Dragon pickaxe", rate: 358, value: 260000, img: "Dragon_pickaxe.png" },
      { name: "Dragon 2h sword", rate: 358, value: 60000000, img: "Dragon_2h_sword.png" },
      { name: "Vet'ion jr.", rate: 2800, value: 0, img: "Vet%27ion_jr..png" }
    ]
  },
  zulrah: {
    name: "Zulrah", unitName: "Kills", keyItem: "Tanzanite fang", type: "standard",
    gear: "Range + Magic combo (blowpipe/trident). Lær rotasjonene, unngå giftskyer.",
    drops: [
      { name: "Tanzanite fang", rate: 512, value: 5000000, img: "Tanzanite_fang.png" },
      { name: "Magic fang", rate: 512, value: 140000, img: "Magic_fang.png" },
      { name: "Serpentine visage", rate: 512, value: 140000, img: "Serpentine_visage.png" },
      { name: "Uncut onyx", rate: 512, value: 1300000, img: "Uncut_onyx.png" },
      { name: "Jar of swamp", rate: 3000, value: 0, img: "Jar_of_swamp.png" },
      { name: "Snakeling", rate: 4000, value: 0, img: "Snakeling.png" }
    ]
  },
  vorkath: {
    name: "Vorkath", unitName: "Kills", keyItem: "Draconic visage", type: "standard",
    gear: "Ranged (DHL/crossbow) + extended antifire. Unngå ice-fase og syrepool.",
    drops: [
      { name: "Draconic visage", rate: 5000, value: 3800000, img: "Draconic_visage.png" },
      { name: "Vorki", rate: 3000, value: 0, img: "Vorki.png" },
      { name: "Jar of decay", rate: 3000, value: 0, img: "Jar_of_decay.png" }
    ]
  },
  cerberus: {
    name: "Cerberus", unitName: "Kills", keyItem: "Primordial crystal", type: "standard",
    gear: "Magic burst (Slayer-utstyr). Drep spøkelser raskt, unngå lava-tornadoer.",
    drops: [
      { name: "Primordial crystal", rate: 512, value: 500000, img: "Primordial_crystal.png" },
      { name: "Pegasian crystal", rate: 512, value: 750000, img: "Pegasian_crystal.png" },
      { name: "Eternal crystal", rate: 512, value: 300000, img: "Eternal_crystal.png" },
      { name: "Jar of souls", rate: 2000, value: 0, img: "Jar_of_souls.png" },
      { name: "Hellpuppy", rate: 3000, value: 0, img: "Hellpuppy.png" }
    ]
  },
  demonicgorilla: {
    name: "Demonic Gorilla", unitName: "Kills", keyItem: "Zenyte shard", type: "standard",
    gear: "Melee/Range/Magic - de bytter stil etter 3 bom, og bruker protection prayer mot din siste brukte stil. Krever konstant prayer- og gear-switching (demonbane-våpen anbefales).",
    drops: [
      { name: "Zenyte shard", rate: 300, value: 16900000, img: "Zenyte_shard.png" },
      { name: "Ballista limbs", rate: 500, value: 100000, img: "Ballista_limbs.png" },
      { name: "Ballista spring", rate: 500, value: 100000, img: "Ballista_spring.png" },
      { name: "Light frame", rate: 750, value: 50000, img: "Light_frame.png" },
      { name: "Heavy frame", rate: 1500, value: 200000, img: "Heavy_frame.png" },
      { name: "Monkey tail", rate: 1500, value: 3000000, img: "Monkey_tail.png" }
    ]
  },
  yama: {
    name: "Yama", unitName: "Kills", keyItem: "Oathplate helm", type: "standard",
    gear: "Melee (slash). Oathplate/Torva + Soulreaper axe/Osmumten's fang. Følg Shadow Waves/Fire Streaks-mekanikken, Shadow Crash-fellen midt i arenaen.",
    drops: [
      { name: "Oathplate helm", rate: 600, value: 55000000, img: "Oathplate_helm.png" },
      { name: "Oathplate chest", rate: 600, value: 75000000, img: "Oathplate_chest.png" },
      { name: "Oathplate legs", rate: 600, value: 65000000, img: "Oathplate_legs.png" },
      { name: "Soulflame horn", rate: 300, value: 45000000, img: "Soulflame_horn.png" },
      { name: "Oathplate shards", rate: 15, value: 170000, img: "Oathplate_shards.png" },
      { name: "Yami", rate: 2500, value: 0, img: "Yami.png" }
    ]
  },
  bluemoon: {
    name: "Blue Moon", unitName: "Kills", keyItem: "Blue moon spear", type: "standard",
    gear: "Melee (crush - Blue Moon er svak mot crush). 1/56 sjanse på et tilfeldig sett-stykke per kill (fordelt ~likt på 4 deler her). Sett gir Frostweaver-effekt (magic).",
    drops: [
      { name: "Blue moon helm", rate: 224, value: 2000000, img: "Blue_moon_helm.png" },
      { name: "Blue moon spear", rate: 224, value: 3000000, img: "Blue_moon_spear.png" },
      { name: "Blue moon robe top", rate: 224, value: 2000000, img: "Blue_moon_robe_top.png" },
      { name: "Blue moon robe bottoms", rate: 224, value: 2000000, img: "Blue_moon_robe_bottoms.png" }
    ]
  },
  eclipsemoon: {
    name: "Eclipse Moon", unitName: "Kills", keyItem: "Eclipse atlatl", type: "standard",
    gear: "Melee (stab - Eclipse Moon er svak mot stab). 1/56 sjanse på et tilfeldig sett-stykke per kill. Sett gir Eclipse-effekt (ranged burn).",
    drops: [
      { name: "Eclipse moon helm", rate: 224, value: 2000000, img: "Eclipse_moon_helm.png" },
      { name: "Eclipse atlatl", rate: 224, value: 3000000, img: "Eclipse_atlatl.png" },
      { name: "Eclipse moon chestplate", rate: 224, value: 2000000, img: "Eclipse_moon_chestplate.png" },
      { name: "Eclipse moon tassets", rate: 224, value: 2000000, img: "Eclipse_moon_tassets.png" }
    ]
  },
  bloodmoon: {
    name: "Blood Moon", unitName: "Kills", keyItem: "Dual macuahuitl", type: "standard",
    gear: "Melee (slash - Blood Moon er svak mot slash). 1/56 sjanse på et tilfeldig sett-stykke per kill. Sett gir Bloodrager-effekt (lifesteal).",
    drops: [
      { name: "Blood moon helm", rate: 224, value: 2000000, img: "Blood_moon_helm.png" },
      { name: "Dual macuahuitl", rate: 224, value: 3000000, img: "Dual_macuahuitl.png" },
      { name: "Blood moon chestplate", rate: 224, value: 2000000, img: "Blood_moon_chestplate.png" },
      { name: "Blood moon tassets", rate: 224, value: 2000000, img: "Blood_moon_tassets.png" }
    ]
  },
  shaman: {
    name: "Lizardman Shaman", unitName: "Kills", keyItem: "Dragon warhammer", type: "standard",
    gear: "Melee eller Range. Enkel slayer-boss, ingen spesiell mekanikk.",
    drops: [
      { name: "Dragon warhammer", rate: 3000, value: 42000000, img: "Dragon_warhammer.png" },
      { name: "Rune med helm", rate: 38.4, value: 11200, img: "Rune_med_helm.png" },
      { name: "Rune warhammer", rate: 38.4, value: 24000, img: "Rune_warhammer.png" },
      { name: "Rune chainbody", rate: 64, value: 30000, img: "Rune_chainbody.png" },
      { name: "Ranarr seed", rate: 680, value: 32000, img: "Ranarr_seed.png" },
      { name: "Snapdragon seed", rate: 850, value: 52000, img: "Snapdragon_seed.png" }
    ]
  }
};
