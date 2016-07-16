# -*- coding: utf-8 -*-
"""
Created on Sat Jul 16 08:10:07 2016

@author: yiyuezhuo
"""

import re
import json
import xml.etree.ElementTree as ET
import os

    
stringTuple = re.compile(r'\((\d+),(\d+)\)')
    
def cut_polygons(line):
    left = line.index('<')
    right = line.index('>')
    name = line[:left].strip()
    content = line[left + 1 : right].strip()
    return { name : [[int(item) for item in stringTuple.match(pair).groups()] for pair in content.split(' ')]}

def parse_polygons(docString):
    sl = docString.split('\n')
    rd = {}
    for s in sl:
        try:
            dic = cut_polygons(s)
        except:
            print('cut fail')
        rd.update(dic)
    return rd
    
def parse_centers(docString):
    sl = docString.split('\n')
    rd = {}
    for line in sl[:-1]:
        index = line.index('(')
        name = line[:index].strip()
        pair = stringTuple.match(line[index:].strip()).groups()
        rd[name] = [int(pair[0]),int(pair[1])]
    return rd
    
def parse_xml(path):
    rd = {}
    tree = ET.parse(path)
    root = tree.getroot()
    game = root#.find('game')
    map_el = game.find('map')
    
    rd['territory'] = {}
    for territory in map_el.findall('territory'):
        name = territory.get('name')
        water = False if territory.get('water') == None else True
        rd['territory'][name] = {'water' : water}
    rd['connection'] = []
    for connection in map_el.findall('connection'):
        rd['connection'].append([connection.get('t1'),connection.get('t2')])
    rd['territoryOwner'] = {}
    for territoryOwner in game.find('initialize').find('ownerInitialize').findall('territoryOwner'):
        territory = territoryOwner.get('territory')
        owner = territoryOwner.get('owner')
        rd['territoryOwner'][territory] = owner
    rd['player'] = {}
    for player in game.find('playerList').findall('player'):
        name = player.get('name')
        optional = player.get('optional')
        rd['player'][name] = {'optional' : optional}
    return rd
    
def parse(path, xml_name = None):
    with open(os.path.join(path, 'polygons.txt')) as f:
        polygons = parse_polygons(f.read())
    with open(os.path.join(path, 'centers.txt')) as f:
        centers = parse_centers(f.read())
    xml_name = os.path.split(path)[1] + '.xml' if xml_name == None else xml_name
    info = parse_xml(os.path.join(path, 'games', xml_name))
    return {'polygons' : polygons, 'centers' : centers, 'info' : info}
        
    
def to_jsonp(obj,callback):
    return "{callback}({content});".format(callback = callback, content = json.dumps(obj))
    
def flow(readPath, writePath, callback, xml_name = None):
    obj = parse(readPath, xml_name = xml_name)
    with open(writePath, 'w') as f:
        f.write(to_jsonp(obj, callback))
    
if __name__ == '__main__':
    
    flow('TripleA/capture_the_flag', 'js/jsonp.js', 'loadJSONP')
    
    DEBUG = False
    
    if DEBUG:

        with open('TripleA/capture_the_flag/polygons.txt') as f:
            s = f.read()
        
            
        sl = s.split('\n')
        nl = [cut_polygons(ss) for ss in sl]
        
        #flow('capture_the_flag/polygons.txt', 'jsonp.js', 'loadJSONP')
        
        with open('TripleA/capture_the_flag/centers.txt') as f:
            s = f.read()
        
        centers = parse_centers(s)
    
